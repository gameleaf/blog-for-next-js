# README

This project is a **work in progress**.

`blog-for-next-js` is a JS library (written in TypeScript) for finding markdown files and making them accessible to [Next.js](https://nextjs.org/) pages.

Take a look at the [GitHub repository](https://github.com/gameleaf/blog-for-next-js). The source code is [MIT Licensed](LICENSE.md).

# Install

`npm install blog-for-next-js`

or

`yarn add blog-for-next-js`

# Use

By default, we assume all blog posts (`*.md` files) are located in the `/posts/` directory of your Next.js project.

## /pages/blog/index.tsx

Use the following code to extract the slugs for your blog. Your page can then loop through the slugs (string[]) to create links to your blog posts.

```
export const getStaticProps: GetStaticProps = async ({ params }) => {
    const blogPosts = new BlogPosts();
    return {
        props: { slugs: blogPosts.getSlugs() },
    };
};
```

Optionally pass in a config object to the BlogPosts() constructor (See [Customization](#customization) below).

## /pages/blog/[...slug].tsx

```
export async function getStaticPaths() {
    const blogPosts = new BlogPosts();
    return {
        paths: blogPosts.getStaticPaths(),
        fallback: false,
    };
}

// Because our page is named [...slug].tsx, the context.params will have a "slug" property.
export const getStaticProps: GetStaticProps = async (context) => {
    const blogPosts = new BlogPosts();
    const blogPostData = blogPosts.getPostDataForSlug(context.params.slug);

    const frontMatter = blogPostData.data;
    const excerpt = blogPostData.excerpt;
    const body = blogPostData.body;

    return {
        props: { frontMatter, excerpt, body },
    };
};

```

## Dependencies

-   gray-matter

## Customization

You can pass in a config object. For example:

```
export const CONFIG: BlogPostsConfig = {
    postsRoot: "posts",
    pageParamName: "slug",
    patternToAccept: /\.md$/,
    patternToReject: /\.draft\.md$/,
};

```

`pageParamName` - Defaults to `"slug"`. You can change this if you use a different param for your dynamic routes. See https://nextjs.org/docs/routing/dynamic-routes

`patternToReject` - Defaults to `undefined`. If you want to reject a particular file extension (e.g., for drafts), you can set the appropriate RegExp.

# Author

Ron B. Yeh (ronyeh@gameleaf.com) - [GameLeaf](https://www.gameleaf.com/)
