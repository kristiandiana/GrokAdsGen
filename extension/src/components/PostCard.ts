// PostCard component - Matches X/Twitter post UI styling
// Creates post cards that match the native X ads.x.com interface

import { Post, Topic } from "../types";

export interface PostCardOptions {
  showTopicContext?: boolean;
  onClick?: (post: Post, topic: Topic) => void;
}

/**
 * Creates a post card element matching X/Twitter's native UI
 */
export function createPostCard(
  post: Post,
  topic: Topic,
  options: PostCardOptions = {}
): HTMLElement {
  const { showTopicContext = false, onClick } = options;

  // Sentiment color mapping (matching X's actual colors)
  const sentimentColors = {
    positive: "rgb(0, 186, 124)", // X green
    negative: "rgb(249, 24, 128)", // X pink/red  
    neutral: "rgb(83, 100, 113)", // X gray
  };

  const sentimentColor = sentimentColors[post.sentiment];

  // Create main article container
  const article = document.createElement("article");
  article.setAttribute("role", "article");
  article.setAttribute("tabindex", "-1");
  article.className = "css-175oi2r r-18u37iz r-1udh08x r-1c4vpko r-1c7gwzm r-1ny4l3l";
  article.style.cssText = `
    padding: 12px 16px;
    border-bottom: 1px solid rgb(239, 243, 244);
    transition: background-color 0.2s;
    cursor: ${onClick ? "pointer" : "default"};
  `;

  // Hover effect
  if (onClick) {
    article.addEventListener("mouseenter", () => {
      article.style.backgroundColor = "rgb(247, 249, 249)";
    });
    article.addEventListener("mouseleave", () => {
      article.style.backgroundColor = "transparent";
    });
    article.addEventListener("click", () => onClick(post, topic));
  }

  // Main content wrapper
  const contentWrapper = document.createElement("div");
  contentWrapper.className = "css-175oi2r r-eqz5dr r-16y2uox r-1wbh5a2";
  article.appendChild(contentWrapper);

  // Inner wrapper
  const innerWrapper = document.createElement("div");
  innerWrapper.className = "css-175oi2r r-16y2uox r-1wbh5a2 r-1ny4l3l";
  contentWrapper.appendChild(innerWrapper);

  // Avatar and content container
  const avatarContentContainer = document.createElement("div");
  avatarContentContainer.className = "css-175oi2r r-18u37iz";
  innerWrapper.appendChild(avatarContentContainer);

  // Avatar placeholder (circular)
  const avatarContainer = document.createElement("div");
  avatarContainer.className = "css-175oi2r r-1iusvr4 r-16y2uox r-ttdzmv";
  avatarContentContainer.appendChild(avatarContainer);

  const avatarWrapper = document.createElement("div");
  avatarWrapper.className = "css-175oi2r r-18u37iz";
  avatarContainer.appendChild(avatarWrapper);

  const avatar = document.createElement("div");
  avatar.className = "css-175oi2r r-1adg3ll r-bztko3";
  avatar.setAttribute("data-testid", "UserAvatar-Container");
  avatar.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgb(29, 155, 240) 0%, rgb(249, 24, 128) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 16px;
  `;
  avatar.textContent = post.author.charAt(0).toUpperCase();
  avatarWrapper.appendChild(avatar);

  // Content section
  const contentSection = document.createElement("div");
  contentSection.className = "css-175oi2r r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu";
  avatarContentContainer.appendChild(contentSection);

  // User info section
  const userInfo = document.createElement("div");
  userInfo.className = "css-175oi2r r-zl2h9q";
  contentSection.appendChild(userInfo);

  const userHeader = document.createElement("div");
  userHeader.className = "css-175oi2r r-k4xj1c r-18u37iz r-1wtj0ep";
  userInfo.appendChild(userHeader);

  const userNameContainer = document.createElement("div");
  userNameContainer.className = "css-175oi2r r-1d09ksm r-18u37iz r-1wbh5a2";
  userHeader.appendChild(userNameContainer);

  const userNameWrapper = document.createElement("div");
  userNameWrapper.className = "css-175oi2r r-1wbh5a2 r-dnmrzs r-1ny4l3l";
  userNameContainer.appendChild(userNameWrapper);

  const userNameInner = document.createElement("div");
  userNameInner.className = "css-175oi2r r-1wbh5a2 r-dnmrzs r-1ny4l3l r-1awozwy r-18u37iz";
  userNameInner.setAttribute("data-testid", "User-Name");
  userNameWrapper.appendChild(userNameInner);

  const userNameLink = document.createElement("div");
  userNameLink.className = "css-175oi2r r-1awozwy r-18u37iz r-1wbh5a2 r-dnmrzs";
  userNameInner.appendChild(userNameLink);

  // Display name
  const displayName = document.createElement("div");
  displayName.className = "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-1udh08x r-3s2u2q";
  displayName.style.cssText = "color: rgb(15, 20, 25); font-weight: 700;";
  displayName.textContent = post.author;
  userNameLink.appendChild(displayName);

  // Username and timestamp
  const userMeta = document.createElement("div");
  userMeta.className = "css-175oi2r r-18u37iz r-1wbh5a2 r-1ez5h0i";
  userNameInner.appendChild(userMeta);

  const userMetaInner = document.createElement("div");
  userMetaInner.className = "css-175oi2r r-1d09ksm r-18u37iz r-1wbh5a2";
  userMeta.appendChild(userMetaInner);

  const usernameSpan = document.createElement("div");
  usernameSpan.className = "css-146c3p1 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-16dba41 r-18u37iz r-1wvb978";
  usernameSpan.style.cssText = "color: rgb(83, 100, 113);";
  usernameSpan.textContent = `${post.username} · ${post.timestamp}`;
  userMetaInner.appendChild(usernameSpan);

  // Topic context badge (if enabled)
  if (showTopicContext) {
    const topicBadge = document.createElement("div");
    topicBadge.className = "css-175oi2r r-1kkk96v";
    userHeader.appendChild(topicBadge);

    const badge = document.createElement("span");
    badge.style.cssText = `
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      background-color: rgb(239, 243, 244);
      color: rgb(83, 100, 113);
      font-size: 12px;
      font-weight: 500;
      margin-left: 8px;
    `;
    badge.textContent = topic.text.substring(0, 30) + (topic.text.length > 30 ? "..." : "");
    topicBadge.appendChild(badge);
  }

  // Tweet text
  const tweetText = document.createElement("div");
  tweetText.className = "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-16dba41 r-bnwqim";
  tweetText.setAttribute("data-testid", "tweetText");
  tweetText.style.cssText = `
    color: rgb(15, 20, 25);
    font-size: 15px;
    line-height: 20px;
    margin-top: 4px;
    margin-bottom: 12px;
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  tweetText.textContent = post.text;
  contentSection.appendChild(tweetText);

  // Engagement bar
  const engagementBar = document.createElement("div");
  engagementBar.className = "css-175oi2r";
  engagementBar.setAttribute("aria-label", "");
  engagementBar.setAttribute("role", "group");
  contentSection.appendChild(engagementBar);

  const engagementContainer = document.createElement("div");
  engagementContainer.className = "css-175oi2r r-1kbdv8c r-18u37iz r-1wtj0ep r-1ye8kvj r-1s2bzr4";
  engagementBar.appendChild(engagementContainer);

  // Engagement buttons (Reply, Retweet, Like, Share)
  const engagementButtons = [
    { label: "Reply", count: 0, icon: "M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" },
    { label: "Repost", count: post.retweets, icon: "M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" },
    { label: "Like", count: post.likes || 0, icon: "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" },
    { label: "Share", count: 0, icon: "M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" },
  ];

  engagementButtons.forEach((btn) => {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "css-175oi2r r-18u37iz r-1h0z5md";
    engagementContainer.appendChild(buttonContainer);

    const button = document.createElement("button");
    button.setAttribute("aria-label", `${btn.count} ${btn.label}`);
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "-1");
    button.className = "css-175oi2r r-1777fci r-bt1l66 r-bztko3 r-lrvibr r-icoktb r-1ny4l3l";
    button.type = "button";
    button.style.cssText = "background: transparent; border: none; cursor: pointer;";

    const buttonContent = document.createElement("div");
    buttonContent.className = "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-16dba41 r-1awozwy r-6koalj r-1h0z5md r-o7ynqc r-clp7b1 r-3s2u2q";
    buttonContent.style.cssText = "color: rgb(83, 100, 113); display: flex; align-items: center; gap: 8px;";

    const iconContainer = document.createElement("div");
    iconContainer.className = "css-175oi2r r-xoduu5";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1xvli5t r-1hdv0qi");
    svg.setAttribute("style", "width: 18.75px; height: 18.75px;");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", btn.icon);
    svg.appendChild(path);
    iconContainer.appendChild(svg);

    const countSpan = document.createElement("div");
    countSpan.className = "css-175oi2r r-xoduu5 r-1udh08x";
    if (btn.count > 0) {
      const countText = document.createElement("span");
      countText.className = "css-1jxf684 r-1ttztb7 r-qvutc0 r-poiln3 r-n6v787 r-1cwl3u0 r-1k6nrdp r-n7gxbd";
      countText.textContent = btn.count.toString();
      countSpan.appendChild(countText);
    }

    buttonContent.appendChild(iconContainer);
    buttonContent.appendChild(countSpan);
    button.appendChild(buttonContent);
    buttonContainer.appendChild(button);
  });

  // Sentiment indicator (subtle border on left)
  const sentimentIndicator = document.createElement("div");
  sentimentIndicator.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: ${sentimentColor};
    opacity: 0.6;
  `;
  article.style.position = "relative";
  article.appendChild(sentimentIndicator);

  return article;
}

/**
 * Creates a container with multiple post cards
 */
export function createPostCardContainer(
  posts: { post: Post; topic: Topic }[],
  options: PostCardOptions = {}
): HTMLElement {
  const container = document.createElement("div");
  container.className = "css-175oi2r";
  container.style.cssText = `
    background-color: rgb(255, 255, 255);
    border-radius: 0;
  `;

  posts.forEach(({ post, topic }) => {
    const card = createPostCard(post, topic, options);
    container.appendChild(card);
  });

  return container;
}

