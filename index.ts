import fs from "fs";
import path from "path";

type BlogPostsConfig = {
    postsRoot?: string;
    patternToAccept?: RegExp;
    patternToReject?: RegExp;
};

const DEFAULT_POSTS_DIR: string = "posts";
const DEFAULT_PATTERN_TO_ACCEPT: RegExp = /\.md$/;

const DEFAULT_BLOG_POSTS_CONFIG: BlogPostsConfig = {
    postsRoot: DEFAULT_POSTS_DIR,
    patternToAccept: DEFAULT_PATTERN_TO_ACCEPT,
    patternToReject: undefined,
};

class BlogPosts {
    postsRootAbsolutePath: string = "";
    slugToAbsolutePath: Record<string, string> = {};
    blogCacheDirectory: string = "";

    constructor(config?: BlogPostsConfig) {
        // If the user does not pass in any config object, we use the defaults.
        if (!config) {
            config = DEFAULT_BLOG_POSTS_CONFIG;
        }
        // If any properties are missing, we fill them in with the defaults.
        if (typeof config.postsRoot === "undefined") {
            config.postsRoot = DEFAULT_POSTS_DIR;
        }
        if (typeof config.patternToAccept === "undefined") {
            config.patternToAccept = DEFAULT_PATTERN_TO_ACCEPT;
        }
        const patternToAccept = config.patternToAccept;
        let patternToReject: RegExp | undefined;
        if (typeof config.patternToReject !== "undefined") {
            patternToReject = config.patternToReject;
        }

        this.postsRootAbsolutePath = path.join(process.cwd(), config.postsRoot);

        this.slugToAbsolutePath = {};

        // Start from the top folder of this.postsRootAbsolutePath
        let itemsToExamine: string[] = [""];

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
                if (patternToReject && patternToReject.test(currItemRelativePath)) {
                    // REJECTED due to patternToReject.
                } else if (patternToAccept.test(currItemRelativePath)) {
                    // MATCHES patternToAccept.
                    const slug = currItemRelativePath.replace(patternToAccept, "");
                    this.slugToAbsolutePath[slug] = currItemAbsolutePath;
                } else {
                    // DOES NOT MATCH patternToAccept.
                }
            }
        }

        console.log(this.slugToAbsolutePath);
    }
}

export { BlogPostsConfig };
export default BlogPosts;
