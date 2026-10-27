import { tx } from '../i18nAuto.js'
import { POSTS, formatPostDate } from '../blog.js'

export function BlogList() {
  return (
    <div className="page">
      <p className="eyebrow">{tx("Blog")}</p>
      <h1>{tx("Notes for the search")}</h1>
      <p className="lede">{tx("Short updates on vouchers and the hunt. These are guides, not a decision on your case.")}</p>
      <ul className="post-list">
        {POSTS.map((post) => (
          <li key={post.slug}>
            <a className="post-card" href={`#/blog/${post.slug}`}>
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BlogPost({ post }) {
  if (!post) {
    return (
      <div className="page">
        <p className="eyebrow">{tx("Blog")}</p>
        <h1>{tx("That note is not on this list.")}</h1>
        <a className="button" href="#/blog">{tx("All posts")}</a>
      </div>
    )
  }
  return (
    <article className="page post">
      <p className="eyebrow">{tx("Blog")}</p>
      <h1>{post.title}</h1>
      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
      {post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <a className="button button-quiet" href="#/blog">{tx("All posts")}</a>
    </article>
  )
}
