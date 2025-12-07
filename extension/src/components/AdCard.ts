// AdCard component - Matches X/Twitter ad post UI styling
// Creates ad cards that look like posts with embedded ad previews

import { Ad, Topic } from "../types";

export interface AdCardOptions {
  onClick?: (ad: Ad, topic: Topic) => void;
}

/**
 * Creates an ad card element matching X/Twitter's native ad post UI
 * This looks like a regular post but with an embedded ad preview card
 */
export function createAdCard(
  ad: Ad,
  topic: Topic,
  options: AdCardOptions = {}
): HTMLElement {
  const { onClick } = options;

  // Create main article container (same structure as PostCard)
  const article = document.createElement("article");
  article.setAttribute("role", "article");
  article.setAttribute("tabindex", "-1");
  article.className =
    "css-175oi2r r-18u37iz r-1udh08x r-1c4vpko r-1c7gwzm r-1ny4l3l";
  article.style.cssText = `
    padding: 12px 16px;
    border-bottom: 1px solid rgb(239, 243, 244);
    transition: background-color 0.2s;
    cursor: ${onClick ? "pointer" : "default"};
    position: relative;
  `;

  // Hover effect
  if (onClick) {
    article.addEventListener("mouseenter", () => {
      article.style.backgroundColor = "rgb(247, 249, 249)";
    });
    article.addEventListener("mouseleave", () => {
      article.style.backgroundColor = "transparent";
    });
    article.addEventListener("click", () => onClick(ad, topic));
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
  // Use first letter of ad title or "A" for Ad
  avatar.textContent = "A";
  avatarWrapper.appendChild(avatar);

  // Content section
  const contentSection = document.createElement("div");
  contentSection.className =
    "css-175oi2r r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu";
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
  userNameInner.className =
    "css-175oi2r r-1wbh5a2 r-dnmrzs r-1ny4l3l r-1awozwy r-18u37iz";
  userNameInner.setAttribute("data-testid", "User-Name");
  userNameWrapper.appendChild(userNameInner);

  const userNameLink = document.createElement("div");
  userNameLink.className = "css-175oi2r r-1awozwy r-18u37iz r-1wbh5a2 r-dnmrzs";
  userNameInner.appendChild(userNameLink);

  // Display name (use ad title or a default)
  const displayName = document.createElement("div");
  displayName.className =
    "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-1udh08x r-3s2u2q";
  displayName.style.cssText = "color: rgb(15, 20, 25); font-weight: 700;";
  displayName.textContent = ad.title || "Advertiser";
  userNameLink.appendChild(displayName);

  // Username and timestamp
  const userMeta = document.createElement("div");
  userMeta.className = "css-175oi2r r-18u37iz r-1wbh5a2 r-1ez5h0i";
  userNameInner.appendChild(userMeta);

  const userMetaInner = document.createElement("div");
  userMetaInner.className = "css-175oi2r r-1d09ksm r-18u37iz r-1wbh5a2";
  userMeta.appendChild(userMetaInner);

  const usernameSpan = document.createElement("div");
  usernameSpan.className =
    "css-146c3p1 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-16dba41 r-18u37iz r-1wvb978";
  usernameSpan.style.cssText = "color: rgb(83, 100, 113);";
  usernameSpan.textContent = `@advertiser · Promoted`;
  userMetaInner.appendChild(usernameSpan);

  // Tweet text (ad description or default)
  const tweetText = document.createElement("div");
  tweetText.className =
    "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-16dba41 r-bnwqim";
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
  tweetText.textContent = ad.description || ad.cta || "Check out this ad";
  contentSection.appendChild(tweetText);

  // Ad preview card (embedded card with image/video, headline, and website)
  const adPreviewContainer = document.createElement("div");
  adPreviewContainer.className = "css-175oi2r r-9aw3ui r-1s2bzr4";
  adPreviewContainer.setAttribute("aria-labelledby", "ad-preview");
  contentSection.appendChild(adPreviewContainer);

  const adPreviewWrapper = document.createElement("div");
  adPreviewWrapper.className =
    "css-175oi2r r-1ets6dv r-1phboty r-rs99b7 r-1udh08x r-1867qdf r-o7ynqc r-6416eg r-1ny4l3l";
  adPreviewContainer.appendChild(adPreviewWrapper);

  const adPreviewCard = document.createElement("div");
  adPreviewCard.className = "css-175oi2r r-1adg3ll r-2dkq44 r-1emcu8v";
  adPreviewCard.setAttribute("id", "ad-preview");
  adPreviewWrapper.appendChild(adPreviewCard);

  // Ad preview button (clickable card)
  const adPreviewButton = document.createElement("button");
  adPreviewButton.setAttribute("aria-label", `${ad.title} Headline`);
  adPreviewButton.setAttribute("role", "button");
  adPreviewButton.className =
    "css-175oi2r r-1udh08x r-13qz1uu r-1loqt21 r-o7ynqc r-6416eg r-1ny4l3l";
  adPreviewButton.type = "button";
  adPreviewButton.style.cssText = `
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
  `;
  adPreviewCard.appendChild(adPreviewButton);

  // Image/video container
  const mediaContainer = document.createElement("div");
  mediaContainer.className = "css-175oi2r r-1adg3ll r-1udh08x";
  mediaContainer.style.cssText = `
    position: relative;
    width: 100%;
    border-radius: 16px 16px 0 0;
    overflow: hidden;
    background-color: rgb(0, 0, 0);
  `;
  adPreviewButton.appendChild(mediaContainer);

  const mediaWrapper = document.createElement("div");
  mediaWrapper.className = "r-1adg3ll r-13qz1uu";
  mediaWrapper.style.cssText = "padding-bottom: 100%;";
  mediaContainer.appendChild(mediaWrapper);

  const mediaInner = document.createElement("div");
  mediaInner.className = "r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-ipm5af r-13qz1uu";
  mediaWrapper.appendChild(mediaInner);

  const mediaContent = document.createElement("div");
  mediaContent.className =
    "css-175oi2r r-1mlwlqe r-1udh08x r-417010 r-aqfbo4 r-agouwx r-1p0dtai r-1d2f490 r-u8s1d r-zchlnj r-ipm5af";
  mediaContent.style.cssText = "margin: 0px; position: relative; width: 100%; height: 100%;";
  mediaInner.appendChild(mediaContent);

  if (ad.videoUrl) {
    const video = document.createElement("video");
    video.src = ad.videoUrl;
    video.controls = true;
    video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      background-color: rgb(0, 0, 0);
    `;
    video.setAttribute("playsinline", "true");
    video.setAttribute("preload", "metadata");
    video.setAttribute("crossorigin", "anonymous");
    // Ensure video can play
    video.muted = false;
    mediaContent.appendChild(video);
  } else if (ad.imageUrl) {
    const image = document.createElement("img");
    image.src = ad.imageUrl;
    image.alt = ad.title;
    image.className = "css-9pa8cd";
    image.draggable = true;
    image.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    mediaContent.appendChild(image);
  } else {
    // Placeholder image
    const placeholder = document.createElement("div");
    placeholder.className =
      "css-175oi2r r-1niwhzg r-vvn4in r-u6sd8q r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-zchlnj r-ipm5af r-13qz1uu r-1wyyakw r-4gszlv";
    placeholder.style.cssText = `
      width: 100%;
      height: 100%;
      background-image: url("https://ton.twimg.com/web-app-framework/advertiser-interface/img/placeholder.ace9dbcc0e5eef1d61b4.png");
      background-size: cover;
      background-position: center;
    `;
    mediaContent.appendChild(placeholder);
  }

  // Headline overlay
  const headlineOverlay = document.createElement("div");
  headlineOverlay.className = "css-175oi2r r-vznvhx r-rki7wi r-u8s1d r-14fd9ze";
  headlineOverlay.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
    padding: 12px;
  `;
  mediaContainer.appendChild(headlineOverlay);

  const headlineText = document.createElement("div");
  headlineText.className =
    "css-175oi2r r-1awozwy r-k200y r-z2wwpe r-z80fyv r-1777fci r-is05cd r-loe9s5 r-dnmrzs r-633pao";
  headlineText.style.cssText = `
    color: rgb(255, 255, 255);
    font-size: 15px;
    font-weight: 700;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  `;
  headlineText.textContent = ad.title;
  headlineOverlay.appendChild(headlineText);

  // Website link below the card
  const websiteLink = document.createElement("button");
  websiteLink.className =
    "css-146c3p1 r-bcqeeo r-qvutc0 r-1qd0xha r-n6v787 r-1cwl3u0 r-16dba41 r-fdjqy7";
  websiteLink.type = "button";
  websiteLink.style.cssText = `
    color: rgb(83, 100, 113);
    font-size: 13px;
    margin-top: 4px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
  `;
  websiteLink.textContent = `From ${ad.target || "website.com"}`;
  adPreviewCard.appendChild(websiteLink);

  // Engagement bar
  const engagementBar = document.createElement("div");
  engagementBar.className = "css-175oi2r";
  engagementBar.setAttribute("aria-label", "");
  engagementBar.setAttribute("role", "group");
  contentSection.appendChild(engagementBar);

  const engagementContainer = document.createElement("div");
  engagementContainer.className =
    "css-175oi2r r-1kbdv8c r-18u37iz r-1wtj0ep r-1ye8kvj r-1s2bzr4";
  engagementBar.appendChild(engagementContainer);

  // Engagement buttons (Reply, Retweet, Like, Share)
  const engagementButtons = [
    {
      label: "Reply",
      count: 0,
      icon: "M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z",
    },
    {
      label: "Repost",
      count: 0,
      icon: "M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z",
    },
    {
      label: "Like",
      count: 0,
      icon: "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z",
    },
    {
      label: "Share",
      count: 0,
      icon: "M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z",
    },
  ];

  engagementButtons.forEach((btn) => {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "css-175oi2r r-18u37iz r-1h0z5md";
    engagementContainer.appendChild(buttonContainer);

    const button = document.createElement("button");
    button.setAttribute("aria-label", `${btn.count} ${btn.label}`);
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "-1");
    button.className =
      "css-175oi2r r-1777fci r-bt1l66 r-bztko3 r-lrvibr r-icoktb r-1ny4l3l";
    button.type = "button";
    button.style.cssText = "background: transparent; border: none; cursor: pointer;";

    const buttonContent = document.createElement("div");
    buttonContent.className =
      "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-16dba41 r-1awozwy r-6koalj r-1h0z5md r-o7ynqc r-clp7b1 r-3s2u2q";
    buttonContent.style.cssText =
      "color: rgb(83, 100, 113); display: flex; align-items: center; gap: 8px;";

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
      countText.className =
        "css-1jxf684 r-1ttztb7 r-qvutc0 r-poiln3 r-n6v787 r-1cwl3u0 r-1k6nrdp r-n7gxbd";
      countText.textContent = btn.count.toString();
      countSpan.appendChild(countText);
    }

    buttonContent.appendChild(iconContainer);
    buttonContent.appendChild(countSpan);
    button.appendChild(buttonContent);
    buttonContainer.appendChild(button);
  });

  // Ad badge (top right corner)
  const adBadge = document.createElement("div");
  adBadge.style.cssText = `
    position: absolute;
    top: 2px;
    right: 12px;
    z-index: 1;
  `;

  const adBadgeInner = document.createElement("div");
  adBadgeInner.className = "Vdr_XBkTSldPcYJzXXsb";
  adBadgeInner.style.cssText = `
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    backdrop-filter: blur(8px);
  `;

  const adIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  adIcon.setAttribute("viewBox", "0 0 24 24");
  adIcon.setAttribute("aria-hidden", "true");
  adIcon.setAttribute("class", "r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1q142lx r-ip8ujx r-1gs4q39 r-14j79pv");
  adIcon.style.cssText = "width: 16px; height: 16px;";
  const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  iconPath.setAttribute(
    "d",
    "M19.498 3h-15c-1.381 0-2.5 1.12-2.5 2.5v13c0 1.38 1.119 2.5 2.5 2.5h15c1.381 0 2.5-1.12 2.5-2.5v-13c0-1.38-1.119-2.5-2.5-2.5zm-3.502 12h-2v-3.59l-5.293 5.3-1.414-1.42L12.581 10H8.996V8h7v7z"
  );
  iconPath.setAttribute("fill", "rgb(83, 100, 113)");
  adIcon.appendChild(iconPath);

  const adText = document.createElement("div");
  adText.className =
    "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-n6v787 r-1cwl3u0 r-16dba41";
  adText.style.cssText =
    "color: rgb(83, 100, 113); font-size: 12px; font-weight: 500;";
  adText.textContent = "Ad";

  adBadgeInner.appendChild(adIcon);
  adBadgeInner.appendChild(adText);
  adBadge.appendChild(adBadgeInner);
  article.appendChild(adBadge);

  return article;
}

/**
 * Creates a container with multiple ad cards
 */
export function createAdCardContainer(
  ads: { ad: Ad; topic: Topic }[],
  options: AdCardOptions = {}
): HTMLElement {
  const container = document.createElement("div");
  container.className = "css-175oi2r";
  container.style.cssText = `
    background-color: rgb(255, 255, 255);
    border-radius: 0;
  `;

  ads.forEach(({ ad, topic }) => {
    const card = createAdCard(ad, topic, options);
    container.appendChild(card);
  });

  return container;
}
