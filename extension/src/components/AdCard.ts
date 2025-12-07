import { Ad, Topic } from "../types";

interface AdCardOptions {
  showTopicContext?: boolean;
  onClick?: (ad: Ad, topic: Topic) => void;
  brandName?: string;
  brandHandle?: string;
  brandAvatarUrl?: string;
}

/**
 * Creates an ad card that replicates X/Twitter's native ad card design
 */
export function createAdCard(
  ad: Ad,
  topic: Topic,
  options: AdCardOptions = {}
): HTMLElement {
  const {
    brandName = "Tesla",
    brandHandle = "@Tesla",
    brandAvatarUrl = "https://pbs.twimg.com/profile_images/1337607516008501250/6Ggc4S5n_400x400.png",
  } = options;

  // Main article container
  const article = document.createElement("article");
  article.setAttribute("role", "article");
  article.setAttribute("tabindex", "-1");
  article.className =
    "css-175oi2r r-18u37iz r-1udh08x r-1c4vpko r-1c7gwzm r-1ny4l3l";
  article.style.cssText = `
    position: relative;
    padding: 10px 14px;
    border-bottom: 1px solid rgb(239, 243, 244);
    transition: background-color 0.2s;
    max-width: 600px;
    margin: 0 auto;
  `;

  article.addEventListener("mouseenter", () => {
    article.style.backgroundColor = "rgb(247, 249, 250)";
  });
  article.addEventListener("mouseleave", () => {
    article.style.backgroundColor = "transparent";
  });

  // Container for content
  const contentContainer = document.createElement("div");
  contentContainer.className = "css-175oi2r r-eqz5dr r-16y2uox r-1wbh5a2";
  contentContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  // Header section with avatar and user info
  const header = document.createElement("div");
  header.className = "css-175oi2r r-16y2uox r-1wbh5a2";
  header.style.cssText = `
    display: flex;
    gap: 12px;
  `;

  // Avatar section
  const avatarContainer = document.createElement("div");
  avatarContainer.className =
    "css-175oi2r r-18kxxzh r-1wron08 r-onrtq4 r-1awozwy";
  avatarContainer.setAttribute("data-testid", "Tweet-User-Avatar");

  const avatar = document.createElement("div");
  avatar.className = "css-175oi2r r-1adg3ll r-bztko3";
  avatar.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  `;

  const avatarImg = document.createElement("img");
  avatarImg.src = brandAvatarUrl;
  avatarImg.alt = brandName;
  avatarImg.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
  `;
  avatar.appendChild(avatarImg);
  avatarContainer.appendChild(avatar);

  // User info section
  const userInfo = document.createElement("div");
  userInfo.className = "css-175oi2r r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu";
  userInfo.style.cssText = `
    flex: 1;
    min-width: 0;
  `;

  const userNameContainer = document.createElement("div");
  userNameContainer.className = "css-175oi2r r-1d09ksm r-18u37iz r-1wbh5a2";
  userNameContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
  `;

  const displayName = document.createElement("div");
  displayName.className = "css-175oi2r r-1awozwy r-18u37iz r-1wbh5a2 r-dnmrzs";
  displayName.style.cssText = `
    font-size: 15px;
    font-weight: 700;
    color: rgb(15, 20, 25);
    line-height: 20px;
  `;
  displayName.textContent = brandName;

  const username = document.createElement("div");
  username.className = "css-175oi2r r-1d09ksm r-18u37iz r-1wbh5a2";
  username.style.cssText = `
    font-size: 15px;
    color: rgb(83, 100, 113);
    line-height: 20px;
    margin-left: 4px;
  `;
  username.textContent = brandHandle;

  userNameContainer.appendChild(displayName);
  userNameContainer.appendChild(username);
  userInfo.appendChild(userNameContainer);

  header.appendChild(avatarContainer);
  header.appendChild(userInfo);

  // Tweet text
  const tweetText = document.createElement("div");
  tweetText.className =
    "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-16dba41 r-bnwqim";
  tweetText.setAttribute("data-testid", "tweetText");
  tweetText.style.cssText = `
    font-size: 15px;
    line-height: 20px;
    color: rgb(15, 20, 25);
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  tweetText.textContent = ad.description || ad.title || "Check this out!";

  // Ad preview section
  const adPreview = document.createElement("div");
  adPreview.className = "css-175oi2r r-9aw3ui r-1s2bzr4";
  adPreview.style.cssText = `
    margin-top: 12px;
    border: 1px solid rgb(207, 217, 222);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
  `;

  // Media container
  const mediaContainer = document.createElement("div");
  mediaContainer.className =
    "css-175oi2r r-1ets6dv r-1phboty r-rs99b7 r-1udh08x r-1867qdf r-o7ynqc r-6416eg r-1ny4l3l";
  mediaContainer.style.cssText = `
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background-color: rgb(0, 0, 0);
  `;

  // Media (image or video)
  if (ad.videoUrl) {
    const videoUrl = ad.videoUrl; // Store in const for type safety
    console.log("Loading video from URL:", videoUrl);

    // Fetch the video as a blob and convert to object URL
    const loadVideoAsBlob = async () => {
      try {
        console.log("Fetching video as blob...");
        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        console.log("Video blob created successfully");
        return { blobUrl, blob };
      } catch (error) {
        console.error("Failed to fetch video as blob:", error);
        return null;
      }
    };

    // Create video element
    const video = document.createElement("video");
    video.controls = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      background-color: rgb(0, 0, 0);
    `;
    video.setAttribute("playsinline", "true");
    video.setAttribute("preload", "metadata");

    // Create loading indicator
    const loadingOverlay = document.createElement("div");
    loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    `;
    loadingOverlay.innerHTML = `
      <div style="font-size: 14px; margin-bottom: 8px;">Loading video...</div>
      <div style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    // Create download button
    const downloadButton = document.createElement("button");
    downloadButton.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 101;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.7);
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    downloadButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16ZM6 20C5.45 20 4.979 19.804 4.587 19.412C4.195 19.02 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.804 19.02 19.412 19.412C19.02 19.804 18.55 20 18 20H6Z" fill="white"/>
      </svg>
    `;
    downloadButton.addEventListener("mouseenter", () => {
      downloadButton.style.background = "rgba(0, 0, 0, 0.9)";
      downloadButton.style.transform = "scale(1.1)";
    });
    downloadButton.addEventListener("mouseleave", () => {
      downloadButton.style.background = "rgba(0, 0, 0, 0.7)";
      downloadButton.style.transform = "scale(1)";
    });

    mediaContainer.appendChild(loadingOverlay);
    mediaContainer.appendChild(video);
    mediaContainer.appendChild(downloadButton);

    // Load video as blob
    loadVideoAsBlob().then((result) => {
      if (result) {
        const { blobUrl, blob } = result;

        // Set video source to blob URL
        video.src = blobUrl;
        video.load();

        // Hide loading overlay once video can play
        video.addEventListener("canplay", () => {
          console.log("Video ready to play");
          loadingOverlay.style.display = "none";
          downloadButton.style.display = "flex";
          video.play().catch((err) => {
            console.log("Autoplay prevented:", err);
          });
        });

        // Setup download button
        downloadButton.addEventListener("click", (e) => {
          e.stopPropagation();
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `ad-${ad.id}-video.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          console.log("Video download initiated");
        });

        // Cleanup blob URL when video is removed
        video.addEventListener("error", () => {
          console.error("Video playback error");
          URL.revokeObjectURL(blobUrl);
        });
      } else {
        // Show error state
        loadingOverlay.innerHTML = `
          <div style="font-size: 14px; margin-bottom: 8px;">⚠️ Failed to load video</div>
          <button onclick="window.open('${videoUrl}', '_blank')" style="
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 13px;
          ">Open in new tab</button>
        `;
      }
    });
  } else if (ad.imageUrl) {
    const imageUrl = ad.imageUrl; // Store in const for type safety
    console.log("Loading image from URL:", imageUrl);

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = ad.title;
    img.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;

    // Create download button for image
    const downloadButton = document.createElement("button");
    downloadButton.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 101;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    downloadButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16ZM6 20C5.45 20 4.979 19.804 4.587 19.412C4.195 19.02 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.804 19.02 19.412 19.412C19.02 19.804 18.55 20 18 20H6Z" fill="white"/>
      </svg>
    `;
    downloadButton.addEventListener("mouseenter", () => {
      downloadButton.style.background = "rgba(0, 0, 0, 0.9)";
      downloadButton.style.transform = "scale(1.1)";
    });
    downloadButton.addEventListener("mouseleave", () => {
      downloadButton.style.background = "rgba(0, 0, 0, 0.7)";
      downloadButton.style.transform = "scale(1)";
    });

    // Download button click handler - fetch as blob on demand
    downloadButton.addEventListener("click", async (e) => {
      e.stopPropagation();

      // Show loading state on button
      downloadButton.innerHTML = `
        <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      `;
      downloadButton.disabled = true;

      try {
        console.log("Downloading image...");
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Get file extension from blob type or URL
        let extension = '.png';
        if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') extension = '.jpg';
        else if (blob.type === 'image/png') extension = '.png';
        else if (blob.type === 'image/gif') extension = '.gif';
        else if (blob.type === 'image/webp') extension = '.webp';
        else {
          // Fallback to URL extension
          const match = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          if (match) extension = match[0];
        }

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `ad-${ad.id}-image${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        console.log("Image download complete");

        // Restore button
        downloadButton.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16ZM6 20C5.45 20 4.979 19.804 4.587 19.412C4.195 19.02 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.804 19.02 19.412 19.412C19.02 19.804 18.55 20 18 20H6Z" fill="white"/>
          </svg>
        `;
        downloadButton.disabled = false;

      } catch (error) {
        console.error("Failed to download image:", error);

        // Show error state briefly, then restore
        downloadButton.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="white"/>
          </svg>
        `;

        setTimeout(() => {
          downloadButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16ZM6 20C5.45 20 4.979 19.804 4.587 19.412C4.195 19.02 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.804 19.02 19.412 19.412C19.02 19.804 18.55 20 18 20H6Z" fill="white"/>
            </svg>
          `;
          downloadButton.disabled = false;
        }, 2000);
      }
    });

    mediaContainer.appendChild(img);
    mediaContainer.appendChild(downloadButton);
  } else {
    // Placeholder
    const placeholder = document.createElement("div");
    placeholder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
    `;
    placeholder.textContent = "Ad Preview";
    mediaContainer.appendChild(placeholder);
  }

  // Make media container clickable
  const mediaUrl = ad.videoUrl || ad.imageUrl;
  const clickableUrl =
    mediaUrl || (ad.cta && ad.cta.startsWith("http") ? ad.cta : null);
  if (clickableUrl) {
    mediaContainer.style.cursor = "pointer";
    mediaContainer.addEventListener("click", () => {
      window.open(clickableUrl, "_blank");
    });
  }

  // Headline overlay button
  const headlineButton = document.createElement("button");
  headlineButton.setAttribute("aria-label", `${ad.title} Headline`);
  headlineButton.setAttribute("role", "button");
  headlineButton.setAttribute("type", "button");
  headlineButton.className =
    "css-175oi2r r-1udh08x r-13qz1uu r-1loqt21 r-o7ynqc r-6416eg r-1ny4l3l";
  headlineButton.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
    border: none;
    cursor: pointer;
    text-align: left;
  `;
  headlineButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent media container click
    const mediaUrl = ad.videoUrl || ad.imageUrl;
    const clickableUrl =
      mediaUrl || (ad.cta && ad.cta.startsWith("http") ? ad.cta : null);
    if (clickableUrl) {
      window.open(clickableUrl, "_blank");
    }
  });

  const headlineText = document.createElement("div");
  headlineText.className =
    "css-175oi2r r-1awozwy r-k200y r-z2wwpe r-z80fyv r-1777fci r-is05cd r-loe9s5 r-dnmrzs r-633pao";
  headlineText.style.cssText = `
    font-size: 15px;
    font-weight: 700;
    color: rgb(255, 255, 255);
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  `;
  headlineText.textContent = ad.title;
  headlineButton.appendChild(headlineText);
  mediaContainer.appendChild(headlineButton);

  adPreview.appendChild(mediaContainer);

  // "From website.com" link
  const websiteLink = document.createElement("button");
  websiteLink.setAttribute("role", "button");
  websiteLink.setAttribute("type", "button");
  websiteLink.className =
    "css-146c3p1 r-bcqeeo r-qvutc0 r-1qd0xha r-n6v787 r-1cwl3u0 r-16dba41 r-fdjqy7";
  websiteLink.style.cssText = `
    font-size: 13px;
    color: rgb(83, 100, 113);
    padding: 8px 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
  `;
  websiteLink.textContent = `From ${ad.target || "website.com"}`;
  adPreview.appendChild(websiteLink);

  // Engagement buttons
  const engagementContainer = document.createElement("div");
  engagementContainer.setAttribute("aria-label", "");
  engagementContainer.setAttribute("role", "group");
  engagementContainer.className =
    "css-175oi2r r-1kbdv8c r-18u37iz r-1wtj0ep r-1ye8kvj r-1s2bzr4";
  engagementContainer.style.cssText = `
    display: flex;
    justify-content: space-between;
    max-width: 425px;
    margin-top: 12px;
  `;

  const engagementButtons = [
    {
      label: "Reply",
      icon: "M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z",
    },
    {
      label: "Repost",
      icon: "M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z",
    },
    {
      label: "Like",
      icon: "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z",
    },
    {
      label: "Share",
      icon: "M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z",
    },
  ];

  engagementButtons.forEach(({ label, icon }) => {
    const button = document.createElement("button");
    button.setAttribute("aria-label", `0 ${label}s. ${label}`);
    button.setAttribute("role", "button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-disabled", "true");
    button.setAttribute("disabled", "");
    button.setAttribute("tabindex", "-1");
    button.className =
      "css-175oi2r r-1777fci r-bt1l66 r-bztko3 r-lrvibr r-icoktb r-1ny4l3l";
    button.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: not-allowed;
      color: rgb(83, 100, 113);
    `;

    const buttonContent = document.createElement("div");
    buttonContent.className =
      "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-16dba41 r-1awozwy r-6koalj r-1h0z5md r-o7ynqc r-clp7b1 r-3s2u2q";
    buttonContent.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    `;

    const iconContainer = document.createElement("div");
    iconContainer.className = "css-175oi2r r-xoduu5";
    iconContainer.style.cssText = `
      width: 18.75px;
      height: 18.75px;
    `;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute(
      "class",
      "r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1xvli5t r-1hdv0qi"
    );
    svg.style.cssText = `
      width: 100%;
      height: 100%;
      fill: currentColor;
    `;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", icon);
    svg.appendChild(path);
    iconContainer.appendChild(svg);

    const count = document.createElement("div");
    count.className = "css-175oi2r r-xoduu5 r-1udh08x";
    count.style.cssText = `
      font-size: 13px;
    `;
    count.innerHTML = `<span>0</span>`;

    buttonContent.appendChild(iconContainer);
    buttonContent.appendChild(count);
    button.appendChild(buttonContent);
    engagementContainer.appendChild(button);
  });

  // "Ad" badge in top-right
  const adBadge = document.createElement("div");
  adBadge.style.cssText = `
    position: absolute;
    top: 2px;
    right: 12px;
    z-index: 1;
  `;

  const badgeContent = document.createElement("div");
  badgeContent.className = "Vdr_XBkTSldPcYJzXXsb";
  badgeContent.style.cssText = `
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    font-size: 12px;
    color: rgb(83, 100, 113);
  `;

  const adIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  adIcon.setAttribute("viewBox", "0 0 24 24");
  adIcon.setAttribute("aria-hidden", "true");
  adIcon.setAttribute(
    "class",
    "r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1q142lx r-ip8ujx r-1gs4q39 r-14j79pv"
  );
  adIcon.style.cssText = `
    width: 16px;
    height: 16px;
    fill: currentColor;
  `;

  const adIconPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  adIconPath.setAttribute(
    "d",
    "M19.498 3h-15c-1.381 0-2.5 1.12-2.5 2.5v13c0 1.38 1.119 2.5 2.5 2.5h15c1.381 0 2.5-1.12 2.5-2.5v-13c0-1.38-1.119-2.5-2.5-2.5zm-3.502 12h-2v-3.59l-5.293 5.3-1.414-1.42L12.581 10H8.996V8h7v7z"
  );
  adIcon.appendChild(adIconPath);

  const adText = document.createElement("div");
  adText.className =
    "css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-n6v787 r-1cwl3u0 r-16dba41";
  adText.style.cssText = `
    font-size: 12px;
    color: rgb(83, 100, 113);
  `;
  adText.textContent = "Ad";

  badgeContent.appendChild(adIcon);
  badgeContent.appendChild(adText);
  adBadge.appendChild(badgeContent);

  // Assemble the card
  contentContainer.appendChild(header);
  contentContainer.appendChild(tweetText);
  contentContainer.appendChild(adPreview);
  contentContainer.appendChild(engagementContainer);

  article.appendChild(contentContainer);
  article.appendChild(adBadge);

  // Add click handler if provided
  if (options.onClick) {
    article.style.cursor = "pointer";
    article.addEventListener("click", () => {
      options.onClick?.(ad, topic);
    });
  }

  return article;
}

/**
 * Creates a carousel container with navigation for ad cards
 */
export function createAdCardContainer(
  ads: Array<{ ad: Ad; topic: Topic }>,
  options: AdCardOptions = {}
): HTMLElement {
  if (ads.length === 0) {
    const emptyContainer = document.createElement("div");
    emptyContainer.style.cssText = `
      padding: 40px;
      text-align: center;
      color: rgb(83, 100, 113);
      font-size: 15px;
    `;
    emptyContainer.textContent = "No ads available";
    return emptyContainer;
  }

  const container = document.createElement("div");
  container.style.cssText = `
    position: relative;
    background: #ffffff;
    max-width: 600px;
    margin: 0 auto;
  `;

  // Carousel wrapper
  const carouselWrapper = document.createElement("div");
  carouselWrapper.style.cssText = `
    position: relative;
    overflow: hidden;
    width: 100%;
  `;

  // Cards container
  const cardsContainer = document.createElement("div");
  cardsContainer.style.cssText = `
    display: flex;
    transition: transform 0.3s ease-in-out;
    will-change: transform;
  `;

  // Create all ad cards
  const cards: HTMLElement[] = [];
  ads.forEach(({ ad, topic }) => {
    const card = createAdCard(ad, topic, options);
    card.style.cssText += `
      flex-shrink: 0;
      width: 100%;
      min-width: 100%;
    `;
    cards.push(card);
    cardsContainer.appendChild(card);
  });

  carouselWrapper.appendChild(cardsContainer);

  // Navigation buttons
  let currentIndex = 0;

  const updateCarousel = () => {
    const translateX = -currentIndex * 100;
    cardsContainer.style.transform = `translateX(${translateX}%)`;
  };

  // Left arrow button
  const leftButton = document.createElement("button");
  leftButton.setAttribute("aria-label", "Previous ad");
  leftButton.setAttribute("type", "button");
  leftButton.style.cssText = `
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgb(207, 217, 222);
    background: rgba(255, 255, 255, 0.95);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  `;
  leftButton.addEventListener("mouseenter", () => {
    leftButton.style.backgroundColor = "rgb(255, 255, 255)";
    leftButton.style.transform = "translateY(-50%) scale(1.1)";
  });
  leftButton.addEventListener("mouseleave", () => {
    leftButton.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    leftButton.style.transform = "translateY(-50%) scale(1)";
  });
  leftButton.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
      updateButtonStates();
      updateIndicators();
    }
  });

  // Left arrow SVG
  const leftArrow = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  leftArrow.setAttribute("viewBox", "0 0 24 24");
  leftArrow.setAttribute("aria-hidden", "true");
  leftArrow.style.cssText = `
    width: 20px;
    height: 20px;
    fill: rgb(15, 20, 25);
  `;
  const leftPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  leftPath.setAttribute(
    "d",
    "M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H20v2H7.414z"
  );
  leftArrow.appendChild(leftPath);
  leftButton.appendChild(leftArrow);

  // Right arrow button
  const rightButton = document.createElement("button");
  rightButton.setAttribute("aria-label", "Next ad");
  rightButton.setAttribute("type", "button");
  rightButton.style.cssText = `
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgb(207, 217, 222);
    background: rgba(255, 255, 255, 0.95);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  `;
  rightButton.addEventListener("mouseenter", () => {
    rightButton.style.backgroundColor = "rgb(255, 255, 255)";
    rightButton.style.transform = "translateY(-50%) scale(1.1)";
  });
  rightButton.addEventListener("mouseleave", () => {
    rightButton.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    rightButton.style.transform = "translateY(-50%) scale(1)";
  });
  rightButton.addEventListener("click", () => {
    if (currentIndex < ads.length - 1) {
      currentIndex++;
      updateCarousel();
      updateButtonStates();
      updateIndicators();
    }
  });

  // Right arrow SVG
  const rightArrow = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  rightArrow.setAttribute("viewBox", "0 0 24 24");
  rightArrow.setAttribute("aria-hidden", "true");
  rightArrow.style.cssText = `
    width: 20px;
    height: 20px;
    fill: rgb(15, 20, 25);
  `;
  const rightPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  rightPath.setAttribute(
    "d",
    "M16.586 11l-5.043-5.04 1.414-1.42L20.414 12l-7.457 7.46-1.414-1.42L16.586 13H4v-2h12.586z"
  );
  rightArrow.appendChild(rightPath);
  rightButton.appendChild(rightArrow);

  // Indicator dots
  const indicatorContainer = document.createElement("div");
  indicatorContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background: #ffffff;
  `;

  const indicators: HTMLElement[] = [];

  // Define updateIndicators before using it
  const updateIndicators = () => {
    indicators.forEach((dot, index) => {
      dot.style.backgroundColor =
        index === currentIndex ? "rgb(15, 20, 25)" : "rgb(207, 217, 222)";
    });
  };

  ads.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.setAttribute("aria-label", `Go to ad ${index + 1}`);
    dot.setAttribute("type", "button");
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: none;
      background: ${index === 0 ? "rgb(15, 20, 25)" : "rgb(207, 217, 222)"};
      cursor: pointer;
      transition: background-color 0.2s;
      padding: 0;
    `;
    dot.addEventListener("click", () => {
      currentIndex = index;
      updateCarousel();
      updateButtonStates();
      updateIndicators();
    });
    indicators.push(dot);
    indicatorContainer.appendChild(dot);
  });

  // Update button states (disable at ends)
  const updateButtonStates = () => {
    if (currentIndex === 0) {
      leftButton.style.opacity = "0.5";
      leftButton.style.cursor = "not-allowed";
      leftButton.setAttribute("disabled", "");
    } else {
      leftButton.style.opacity = "1";
      leftButton.style.cursor = "pointer";
      leftButton.removeAttribute("disabled");
    }

    if (currentIndex === ads.length - 1) {
      rightButton.style.opacity = "0.5";
      rightButton.style.cursor = "not-allowed";
      rightButton.setAttribute("disabled", "");
    } else {
      rightButton.style.opacity = "1";
      rightButton.style.cursor = "pointer";
      rightButton.removeAttribute("disabled");
    }
  };

  // Initialize
  updateButtonStates();
  updateIndicators();

  // Assemble carousel
  container.appendChild(carouselWrapper);
  container.appendChild(indicatorContainer);
  carouselWrapper.appendChild(leftButton);
  carouselWrapper.appendChild(rightButton);

  return container;
}
