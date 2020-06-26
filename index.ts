import fs from "fs";
import matter from "gray-matter";
import path from "path";

type BlogPostsConfig = {
    postsRoot?: string;
    patternToAccept?: RegExp;
    patternToReject?: RegExp;
    pageParamName?: string;
};

const DEFAULT_POSTS_DIR: string = "posts";
const DEFAULT_PAGE_PARAM_NAME: string = "slug";
const DEFAULT_PATTERN_TO_ACCEPT: RegExp = /\.md$/;

type BlogPostsConfigInternal = {
    postsRoot: string;
    patternToAccept: RegExp;
    patternToReject: RegExp | undefined;
    pageParamName: string;
};

class BlogPosts {
    private config: BlogPostsConfigInternal = {
        postsRoot: DEFAULT_POSTS_DIR,
        patternToAccept: DEFAULT_PATTERN_TO_ACCEPT,
        patternToReject: undefined,
        pageParamName: DEFAULT_PAGE_PARAM_NAME,
    };

    postsRootAbsolutePath: string = "";
    slugToAbsolutePath: Record<string, string> = {};
    blogCacheDirectory: string = "";
    hasPatternToReject: Boolean = false;

    constructor(userConfig?: BlogPostsConfig) {
        if (userConfig) {
            this.loadConfig(userConfig);
        }

        this.postsRootAbsolutePath = path.join(process.cwd(), this.config.postsRoot);

        this.slugToAbsolutePath = {};

        // Start from the top folder of this.postsRootAbsolutePath
        let itemsToExamine: string[] = [""];

        const hasPatternToReject = this.hasPatternToReject;
        const patternToAccept = this.config.patternToAccept;

        // All of the folders we examine will be relative to this.postsRootAbsolutePath
        while (itemsToExamine.length > 0) {
            const currItemRelativePath = itemsToExamine.pop(); // Remove the last item.
            if (typeof currItemRelativePath !== "string") {
                continue;
            }

            const currItemAbsolutePath = path.join(this.postsRootAbsolutePath, currItemRelativePath);

            const stat = fs.lstatSync(currItemAbsolutePath);
            if (stat.isDirectory()) {
                // We found a DIRECTORY, so we need to dig deeper.
                const childItems = fs.readdirSync(currItemAbsolutePath);
                for (const childItemName of childItems) {
                    const absolutePath = path.join(currItemRelativePath, childItemName);
                    itemsToExamine.unshift(absolutePath); // Add this item to the beginning of our array.
                }
            } else {
                // FILE
                if (hasPatternToReject && this.config.patternToReject!.test(currItemRelativePath)) {
                    // REJECTED due to patternToReject.
                    // console.log("Rejected: " + currItemRelativePath);
                } else if (patternToAccept.test(currItemRelativePath)) {
                    // MATCHES patternToAccept.
                    const slug = currItemRelativePath.replace(patternToAccept, "");
                    this.slugToAbsolutePath[slug] = currItemAbsolutePath;
                    // console.log("Matched: " + currItemRelativePath);
                } else {
                    // DOES NOT MATCH patternToAccept.
                    // console.log("Ignored: " + currItemRelativePath);
                }
            }
        }

        // console.log(this.slugToAbsolutePath);
    }

    // Override our defaults with the user's supplied options.
    loadConfig(userConfig: BlogPostsConfig) {
        if (typeof userConfig.postsRoot !== "undefined") {
            this.config.postsRoot = userConfig.postsRoot;
        }
        if (typeof userConfig.patternToAccept !== "undefined") {
            this.config.patternToAccept = userConfig.patternToAccept;
        }
        if (typeof userConfig.patternToReject !== "undefined") {
            this.config.patternToReject = userConfig.patternToReject;
            this.hasPatternToReject = true;
        }
        if (typeof userConfig.pageParamName !== "undefined") {
            this.config.pageParamName = userConfig.pageParamName;
        }
    }

    // Returns the slugs in the format that Next.js expects.
    getStaticPaths() {
        const paths = [];
        for (const slug in this.slugToAbsolutePath) {
            const pathToAdd: { params: any } = { params: {} };
            pathToAdd.params[this.config.pageParamName] = slug.split("/");
            paths.push(pathToAdd);
        }
        return paths;
    }

    getSlugs() {
        const slugs = [];
        for (const slug in this.slugToAbsolutePath) {
            slugs.push(slug);
        }
        return slugs;
    }

    // gray-matter is required.
    getPostDataForSlug(slug: string | string[]) {
        if (typeof slug !== "string") {
            slug = slug.join("/"); // Turn the string[] into a string delimited by slashes
        }
        const fileString = fs.readFileSync(this.slugToAbsolutePath[slug], "utf8");
        let grayMatterResult = matter(fileString, { excerpt: true });

        // TODO: Check if there's an excerpt first!
        let indexOfSeparator = grayMatterResult.content.indexOf("---");
        let body = grayMatterResult.content.substring(indexOfSeparator + 3).trim();
        return { ...grayMatterResult, body };
    }
}

export { BlogPostsConfig };
export default BlogPosts;
