import { Post, Topic } from "../types";

interface PostCardOptions {
  showTopicContext?: boolean;
  onClick?: (post: Post, topic: Topic) => void;
}

// Build a dark-mode list of post cards that look closer to native tweets
export function createPostCardContainer(
  posts: Array<{ post: Post; topic: Topic }>,
  options: PostCardOptions = {}
): HTMLElement {
  const container = document.createElement("div");
  container.style.background = "#ffffff";
  container.style.color = "#0f172a";
  container.style.padding = "12px";
  container.style.borderRadius = "12px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "12px";

  posts.forEach(({ post, topic }) => {
    const card = document.createElement("div");
    card.style.background = "#ffffff";
    card.style.border = "1px solid #e2e8f0";
    card.style.borderRadius = "12px";
    card.style.padding = "12px";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "8px";
    card.style.cursor = options.onClick ? "pointer" : "default";
    card.addEventListener("click", () => {
      options.onClick?.(post, topic);
    });

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.gap = "8px";
    header.style.fontSize = "13px";
    header.style.color = "#475569";

    const time = document.createElement("span");
    time.textContent = post.timestamp || "";

    header.appendChild(time);

    const body = document.createElement("div");
    body.style.fontSize = "14px";
    body.style.lineHeight = "1.5";
    body.style.color = "#0f172a";
    body.style.whiteSpace = "pre-wrap";
    body.textContent = post.text;

    const meta = document.createElement("div");
    meta.style.display = "flex";
    meta.style.gap = "12px";
    meta.style.fontSize = "12px";
    meta.style.color = "#475569";
    meta.innerHTML = `
      <span>🔁 ${post.retweets ?? 0}</span>
      <span>❤ ${post.likes ?? 0}</span>
      <span>Sentiment: ${post.sentiment}</span>
      ${
        options.showTopicContext
          ? `<span style="color:#8899a6;">Topic: ${escapeHtml(
              topic.text
            )}</span>`
          : ""
      }
    `;

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(meta);
    container.appendChild(card);
  });

  return container;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
