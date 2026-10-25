const route = window.location.pathname.replace(/\/+$/, "") || "/";
try {
  if (route === "/") await import("./home.js");
  else await import("./app.js");
  document.querySelectorAll("[data-boot-disabled]").forEach(control => control.removeAttribute("disabled"));
  document.body.dataset.ready = "true";
} catch {
  document.body.className = "app-loading";
  document.body.innerHTML = '<main><h1>ページを読み込めませんでした</h1><p>通信状態を確認して、もう一度お試しください。</p><button type="button" class="primary-button" id="retry-page">再読み込み</button><p><a href="/">ホームに戻る</a></p></main>';
  document.getElementById("retry-page")?.addEventListener("click", () => window.location.reload());
}
export {};
