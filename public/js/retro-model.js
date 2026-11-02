(() => {
  const viewer = document.querySelector("#retro-computer");
  const wrapper = document.querySelector("#retro-model");
  if (!viewer || !wrapper) return;

  const fallback = wrapper.querySelector(".retro-model__fallback");
  const fail = () => {
    wrapper.dataset.state = "error";
    fallback.textContent = "3D preview unavailable.";
  };

  const loadViewer = () => import(
    "https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js"
  ).catch(fail);

  if (document.getElementById("loader")) {
    const observer = new MutationObserver(() => {
      if (!document.getElementById("loader")) {
        observer.disconnect();
        loadViewer();
      }
    });
    observer.observe(document.body, { childList: true });
  } else {
    loadViewer();
  }

  viewer.addEventListener("load", () => {
    wrapper.dataset.state = "ready";
  });
  viewer.addEventListener("error", fail);

  if (!window.DecompressionStream) {
    fail();
    return;
  }

  fetch("public/assets/models/retro-computer.glb.gz")
    .then(async response => {
      if (!response.ok) throw new Error("Model not found");
      const bytes = await response.arrayBuffer();
      const header = new Uint8Array(bytes, 0, 2);
      if (header[0] !== 31 || header[1] !== 139) return new Blob([bytes]);
      return new Response(new Blob([bytes]).stream().pipeThrough(
        new DecompressionStream("gzip")
      )).blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(new Blob([blob], { type: "model/gltf-binary" }));
      viewer.setAttribute("src", url);
      viewer.dataset.assetReady = "true";
      window.addEventListener("pagehide", () => URL.revokeObjectURL(url), { once: true });
    })
    .catch(fail);
})();
