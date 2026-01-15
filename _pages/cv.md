---
layout: archive
title: "CV"
permalink: /CV/
author_profile: true
---

You can download a PDF version of my CV
[here](/files/LIU%20Yuanze_CV_20260113.pdf).

<style>
/* 容器样式 */
.cv-frame-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

/* iframe 核心样式 */
.cv-frame-wrapper iframe {
  /* 电脑端默认设置 */
  width: 80%;               
  height: 55vh;             
  border: none;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* --- 响应式设计 (手机/平板适配) --- */

/* 平板 (iPad 等) */
@media (max-width: 1024px) {
  .cv-frame-wrapper iframe {
    width: 90%;             
    height: 50vh;           
  }
}

/* 手机 (iPhone / Android) */
@media (max-width: 768px) {
  .cv-frame-wrapper iframe {
    width: 95%;             /* 【已修改】改为 95%，防止紧贴手机屏幕边缘 */
    height: 50vh;           /* 【已修改】大幅减小高度，防止手机滑动时“陷”在PDF里出不来 */
    min-height: 400px;      /* 保证最小高度，避免太扁 */
  }
}
</style>

<div class="cv-frame-wrapper">
  <iframe
    src="/files/LIU%20Yuanze_CV_20260113.pdf#view=FitH"
    loading="lazy"
    title="CV Preview">
  </iframe>
</div>