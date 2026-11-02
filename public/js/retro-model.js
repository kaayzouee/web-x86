(() => {
  const viewer = document.querySelector("#retro-computer");
  const wrapper = document.querySelector("#retro-model");
  if (!viewer || !wrapper) return;

  const fallback = wrapper.querySelector(".retro-model__fallback");
  const fail = () => {
    wrapper.dataset.state = "error";
    fallback.textContent = "3D preview unavailable.";
  };

  viewer.addEventListener("load", () => {
    wrapper.dataset.state = "ready";
  });
  viewer.addEventListener("error", fail);

  if (!window.DecompressionStream) {
    fail();
    return;
  }

  fetch("public/assets/models/retro-computer.glb.gz")
    .then(response => {
      if (!response.ok || !response.body) throw new Error("Model not found");
      return new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(new Blob([blob], { type: "model/gltf-binary" }));
      viewer.src = url;
      viewer.dataset.assetReady = "true";
      window.addEventListener("pagehide", () => URL.revokeObjectURL(url), { once: true });
    })
    .catch(fail);
})();
