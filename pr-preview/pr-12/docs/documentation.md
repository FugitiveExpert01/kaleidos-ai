# 3D2AI Documentation

> **3D2AI** turns a blocked-out Blender scene into a generated image without ever leaving the viewport. Enter a prompt, hit generate, done.
> For 3D artists, not AI engineers.

---

## Table of Contents

- [Overview](#1-overview)
- [Included Features](#2-included-features)
- [Installation](#3-installation)
- [Access / Location in Blender](#4-access--location-in-blender)
- [Recommended Workflow](#5-recommended-workflow)
- [Prompt Guide](#6-prompt-guide)
- [Safety Notes & Privacy](#7-safety-notes--privacy)
- [Compatibility & System Requirements](#8-compatibility--system-requirements)
- [Quick Start](#9-quick-start)
- [Advanced Settings](#10-advanced-settings)
- [Troubleshooting](#11-troubleshooting)
- [License & Third-Party Components](#12-license--third-party-components)

---

## 1. Overview

### What is 3D2AI?

3D2AI is a Blender add-on that uses a locally-running AI image generation pipeline to produce final images from rough viewport compositions. It captures the current 3D view — including camera, layout, and lighting — as a conditioning reference, accepts a text prompt, and produces an image in under a minute without rendering.

### Architecture

```
[Blender Viewport]
       |
       v
[Render-Block Capture] --> greybox reference image
       |
       v
[stable-diffusion.cpp (local subprocess)]
       |
       +-- FLUX.2-klein-4B (diffusion model)
       +-- Qwen3-4B (text encoder / LLM)
       +-- full_encoder_small_decoder (VAE)
       +-- Flux_Klein_4B_3D2AI_LoRA (fine-tuned adapter)
       |
       v
[Generated PNG]
```

### What's in the box

When you run the guided installer, the add-on downloads the following components to your machine:

- **stable-diffusion.cpp backend** (`sd-cli.exe`, the inference engine)
- **FLUX.2-klein-4B GGUF** (`flux-2-klein-4b-Q4_K_M.gguf`) — the base diffusion model
- **Qwen3-4B GGUF** (`qwen3-4b-q4_k_m.gguf`) — the text encoder that processes your prompt
- **FLUX.2-small-decoder** (`full_encoder_small_decoder.safetensors`) — the VAE that decodes latents to pixels
- **3D2AI LoRA** (`Flux_Klein_4B_3D2AI_BF16_R16.safetensors`) — a custom adapter fine-tuned on real Blender scene data so the output respects 3D structure

All components are downloaded automatically. You do not need to fetch them manually.

### Data flow

```
Your scene
    |
    v
Render-block capture --> saved to %APPDATA%\3D2AI\captures\references\
    |
    v
Text prompt + reference image --> stable-diffusion.cpp subprocess
    |
    v
PNG written to your chosen output path
```

Nothing is ever uploaded after installation. Downloads happen once. After that, the add-on is fully offline.

---

## 2. Included Features

### Viewport conditioning

The add-on captures the current 3D View through Blender's render-block mechanism, producing a low-cost reference image that preserves camera angle, framing, perspective, and object placement. This reference acts as the structural backbone of the generation. Because it comes from your actual viewport, you do not need to set up a full render to get meaningful conditioning.

### 3D2AI LoRA adapter

The add-on ships with a custom LoRA adapter trained on a mix of synthetic and real Blender scene data. This adapter is loaded automatically during generation and can be enabled or disabled, with configurable strength from 0.0 to 2.0. A strength of 1.0 provides balanced scene-structure adherence; values above 1.0 increase structural fidelity at the cost of some prompt flexibility; a value of 0.0 disables the adapter entirely, falling back to vanilla FLUX.

### Reference image (experimental)

You can optionally supply an external image as conditioning input. The uploaded image is resized to match the target render resolution before being passed to the backend. This panel is marked experimental because image-to-image behavior with 3D scene data is still being refined.

### Recent jobs list

Every generation is tracked with a UUID, prompt excerpt, seed, elapsed time, and output path. The Recent Jobs panel lets you scroll past runs, copy CLI arguments from any job, and reproduce results by reusing the seed.

### Error logging

Errors from download operations, subprocess execution, or backend communication are surfaced in a dedicated Error Logs panel. Each error can be copied to the clipboard for reporting.

### Text block integration

The prompt field is mirrored into a native Blender text block named `D2AI_Prompt`. This means prompts are stored inside your `.blend` file and travel with it. You can also open the prompt in Blender's text editor for longer or multi-line inputs.

### Raw CLI argument editing

Advanced users can hand-edit `stable-diffusion.cpp` arguments in a dedicated field or in the mirrored `D2AI_RawArgs` text block. The UI maintains bidirectional sync: changes in one place update the other.

### Multi-model management

Each model component (diffusion, LLM, VAE, LoRA, backend binary) has its own download URL, with a primary source and a fallback mirror. This improves reliability in low-bandwidth environments and protects against primary CDN outages. Dependencies are managed independently — install or delete any component without affecting the others.

### Configurable device offloading

For GPUs with limited VRAM, each sub-model's computation device (runtime backend) and weight storage (params backend) can be set independently. Available options are CUDA (GPU), CPU (RAM), and Disk (streaming). When stream layers is active, the add-on automatically pins params backends to CPU to maintain consistency.

---

## 3. Installation

### Pre-installation checklist

Before installing, confirm the following:

- You are on **Windows 10 or 11 x64** (the only officially supported platform).
- You have **Blender 4.2 LTS** or later installed.
- You have an **NVIDIA GPU with CUDA 12+** driver support.
- You have **7–10 GiB of free disk space** for the guided installer downloads.
- You have an **active internet connection** for the one-time download.

### Step-by-step

1. Download the release `.zip` from the Superhive product page.
2. Open Blender.
3. Go to **Edit → Preferences → Extensions**.
4. Click **Install from Disk** and select the downloaded `.zip` file.
5. Enable the add-on in the Extensions panel if it is not already enabled.
6. Restart Blender if prompted.
7. Go to the **Render Properties** tab.
8. Open the **Render Engine** dropdown and select **3D2AI**.
9. The 3D2AI panels appear in the Render Properties tab (see [Access / Location in Blender](#4-access--location-in-blender)).
10. Open the **Dependencies** panel and click **Install**.
11. The guided installer downloads and extracts the following:
    - `stable-diffusion.cpp` backend (~0.33 GiB) + CUDA runtime (~0.52 GiB)
    - FLUX.2-klein-4B diffusion model (~2.43 GiB)
    - Qwen3-4B text encoder (~2.33 GiB)
    - FLUX.2-small VAE (~0.23 GiB)
    - 3D2AI LoRA adapter
12. Wait until the Dependencies panel shows **Status: Installed** with all 6 components ready.
13. Set your output path in the **Output** panel.
14. Enter a prompt in the **Generate** panel and click Generate.

### Download sizes (for reference)

| Component | Approximate Size |
|-----------|-----------------|
| stable-diffusion.cpp backend | ~0.33 GiB |
| CUDA 12 runtime | ~0.52 GiB |
| FLUX.2-klein-4B GGUF | ~2.43 GiB |
| Qwen3-4B GGUF | ~2.33 GiB |
| FLUX.2-small VAE | ~0.23 GiB |
| 3D2AI LoRA | < 0.1 GiB |
| **Total (default)** | **~5.84 GiB** |

Free disk recommendation after extraction and with space for generated images: **7–10 GiB**.

### Fallback download mirrors

The add-on uses a primary + fallback mirror system for all downloads. If a primary source is unreachable, the installer automatically retries from the fallback mirror. You do not need to take any action.

---

## 4. Access / Location in Blender

All 3D2AI panels are located in the **Render Properties** tab, accessible when the render engine is set to **3D2AI**.

### Panel map

| Panel | Internal ID | Purpose |
|-------|-------------|---------|
| Dependencies | `D2AI_PT_dependencies_panel` | Install, delete, and monitor backend + model downloads. Shows progress bar and error status. |
| Generate | `D2AI_PT_generate_panel` | Primary panel. Prompt input, seed, steps, resolution factor, generate button, and collapsible Advanced / Performance section. |
| Reference Image (experimental) | `D2AI_PT_reference_panel` | Upload an external conditioning image. Resizes to match target resolution automatically. |
| Output | `D2AI_PT_output_panel` | File path for generated PNGs. |
| Recent Jobs | `D2AI_PT_recent_jobs_panel` | Scrollable list of past generations with prompt excerpt, seed, elapsed time, and copy button. |
| Error Logs | `D2AI_PT_error_logs_panel` | Shows the most recent error message with a one-click copy button. |

Panel rendering order: Dependencies (0), Generate (1), Reference Image (2), Output (3), Recent Jobs (4), Error Logs (5).

### Auto-created text blocks

When you interact with the add-on, the following text blocks may appear in Blender's Text Editor:

- **`D2AI_Prompt`** — Mirrors the prompt field. Stored inside the `.blend` file with your scene. Useful for long prompts or versioning.
- **`D2AI_RawArgs`** — Mirrors the advanced raw CLI arguments string. Editable by hand; changes sync back to the UI.

---

## 5. Recommended Workflow

### Step 1 — Compose

Set up your viewport scene. Add a camera, rough geometry, collections, and basic lighting. You do not need to shade objects or run a full render. The greybox quality of your viewport directly influences the composition of the generated image.

### Step 2 — Configure output

Open the **Output** panel and set the file path where generated PNGs should be saved. The add-on always writes PNGs.

### Step 3 — Write the prompt

Follow the prompt structure in [Section 6: Prompt Guide](#6-prompt-guide). Keep it concise and visual. The prompt adds detail; it does not override camera, framing, perspective, or object placement, all of which are controlled by your greybox reference.

### Step 4 — Set advanced options (optional)

- Confirm **LoRA** is enabled (it is on by default). Adjust **LoRA Strength** between 0.0 and 2.0 if you want more or less scene-structure adherence.
- Enable **Stream Layers** if your GPU has less than 8 GiB VRAM. This pages model weights incrementally and prevents out-of-memory crashes, but increases generation time.
- Enable **Flash Attention** if your GPU supports it (CUDA-only).
- Enable **VRAM Override** if you want to explicitly set a VRAM budget in GiB for the backend. Enter the value in the adjacent field.

### Step 5 — Generate

Click **Generate** in the Generate panel. The viewport status area shows progress. A Full HD generation on an RTX 4070 (12 GiB VRAM) typically completes in under a minute.

### Step 6 — Evaluate and iterate

- Adjust the prompt and re-generate with a new seed for variants.
- Use the **Recent Jobs** panel to review past runs and copy the args string from a generation you want to reproduce.
- Use the **Seed** field to reproduce an exact result.
- Change the **Steps** field if needed; note that stepping beyond 4 does not produce materially higher quality output for the FLUX-based pipeline.

### Full walkthrough example

> **Scene**: A greyboxed living room with a window, a sofa block, a coffee table, and a warm area light.
> **Prompt**: *"Modern living room, warm minimalist interior, oak floors and linen sofa, soft afternoon window light, cozy atmosphere, clean detailed"*
> **Steps**: 4
> **Seed**: random
> **Stream Layers**: off (GPU has 12 GiB)
> **Flash Attention**: on
> **LoRA Strength**: 1.0
> **Output**: `/renders/3d2ai/living_room_v1.png`

---

## 6. Prompt Guide

### Core rule

The reference image defines composition, perspective, and camera. The prompt adds detail, never overrides.

### Prompt structure

Use this order every time:

1. Subject
2. Style
3. Materials
4. Lighting
5. Mood
6. Detail level

### Example

> A brutalist concrete house, minimalist architecture, raw cement and glass, soft overcast lighting, calm atmosphere, high detail

### What you can control

| Variable | Examples |
|----------|----------|
| Material | wood, metal, fabric, stone, concrete, glass |
| Style | cyberpunk, modernist, baroque, brutalist, art deco, scandinavian |
| Lighting | sunset, studio, neon, foggy, overcast, volumetric |
| Mood | eerie, warm, sterile, cozy, tense |
| Detail | ultra detailed, clean, rough, polished, weathered |

### What is locked by the greybox reference

Do not attempt to change these through the prompt. They are determined entirely by your viewport scene:

- Camera angle
- Framing
- Perspective
- Object placement
- Scene layout

### Good prompt habits

- Be specific but short.
- Use visual words, not abstract ideas.
- Prefer concrete nouns and adjectives.
- Avoid storytelling or long sentences.

### Common mistakes

- Trying to change viewpoint (the prompt cannot override the camera).
- Including conflicting styles (e.g., "minimalist baroque chaos").
- Overloading with too many concepts in one prompt.
- Restating information already present in the greybox reference.

### Strong example

**Input intent**: turn a greyboxed sci-fi lab into a finished environment.

**Prompt**:

> Futuristic laboratory interior, clean sci-fi style, white panels and glowing blue interfaces, reflective metal surfaces, soft volumetric lighting, sterile atmosphere, ultra detailed

### Weak example

> Change camera to top view, add a city, make it chaotic and peaceful at the same time

This is weak because it tries to override camera and composition (locked by greybox) and combines contradictory mood directions.

---

## 7. Safety Notes & Privacy

### Nothing leaves your machine

Your scenes, prompts, and generated images are never transmitted or uploaded after the guided install is complete. All generation runs locally on your hardware.

### One-time downloads only

The add-on requires internet access only during the initial guided install, while it downloads the backend and models. After all dependencies are installed, the add-on is fully offline.

### Local data storage

The add-on stores runtime data under:

**Windows**: `%APPDATA%\3D2AI\`

Key sub-paths:

| Path | Contents |
|------|----------|
| `%APPDATA%\3D2AI\captures\references\` | Greybox reference images captured before generation |
| `%APPDATA%\3D2AI\captures\workbench\` | Workbench captures |
| `%APPDATA%\3D2AI\dependencies\models\diffusion\` | FLUX diffusion model |
| `%APPDATA%\3D2AI\dependencies\models\llm\` | Qwen3 text encoder |
| `%APPDATA%\3D2AI\dependencies\models\vae\` | FLUX VAE |
| `%APPDATA%\3D2AI\dependencies\models\lora\` | 3D2AI LoRA adapter |
| `%APPDATA%\3D2AI\dependencies\backend\sd\` | stable-diffusion.cpp binaries |
| `%APPDATA%\3D2AI\jobs.json` | Generation job history |
| `%APPDATA%\3D2AI\history.json` | Runtime state |

Generated PNGs are written to whichever output path you configure in the **Output** panel. This is separate from the add-on's runtime directory.

### No telemetry

The add-on does not send usage data, crash reports, prompt content, or generation results to any server. There is no analytics or phoning home.

### VRAM and stability warnings

- Generating on a GPU with VRAM below the practical baseline risks out-of-memory errors and possible GPU or driver resets.
- Use **Stream Layers** if your GPU has less than 8 GiB VRAM. Incremental weight paging prevents OOM at the cost of longer generation times.
- Use the **VRAM Override** field to specify a manual VRAM budget in GiB if you want to constrain the backend's memory allocation.
- CPU-only mode is supported but is slower; the default backend package is the CUDA 12 build.

---

## 8. Compatibility & System Requirements

### Minimum baseline

| Component | Requirement | Notes |
|-----------|-------------|-------|
| OS | Windows 10 / 11 x64 | Only officially supported platform |
| Blender | 4.2 LTS or later | Built against 4.2.0 API; should work on later LTS releases |
| GPU | NVIDIA with CUDA 12+ driver | Primary compute device |
| VRAM (minimum practical) | 6 GiB | Enable Stream Layers below this |
| VRAM (recommended) | 8–12 GiB | Full HD output without offloading |
| System RAM | 16 GiB | More helps when weights are offloaded to CPU |
| Disk space | 7–10 GiB free | ~5.84 GiB downloads + extraction + captures + outputs |
| Internet | One-time during install | Required only for the guided installer |

### Supported configuration

| Parameter | Supported | Not supported |
|-----------|-----------|---------------|
| Windows x64 + NVIDIA CUDA 12 | Fully supported | — |
| Windows x64 + CPU only | Supported (slow) | — |
| Linux x64 | Not officially supported; may work with manual backend replacement | No installer support |
| macOS (Intel / Apple Silicon) | Not supported | No installer support |
| AMD GPU | Not supported | CUDA-only backend |

### GPU driver requirements

Because the add-on communicates with `stable-diffusion.cpp` via the CUDA 12 runtime, you need a CUDA 12-compatible NVIDIA driver. Check your driver version in the NVIDIA Control Panel or with `nvidia-smi`.

### Why Windows only?

The bundled backend package (`sd-master-...-bin-win-cuda12-x64.zip`) and the executable `sd-cli.exe` are compiled for Windows x64. A Linux or macOS installation would require replacing the backend package with a platform-appropriate build of `stable-diffusion.cpp` and adjusting the executable path and permissions manually. This is outside the scope of official support.

---

## 9. Quick Start

The fastest path from install to first image:

1. Install the add-on in Blender via **Edit → Preferences → Extensions → Install from Disk** and enable it.
2. Set **Render Engine** to **3D2AI** in the Render Properties tab.
3. Open the **Dependencies** panel and click **Install**. Wait for "Status: Installed".
4. In the **Output** panel, set a destination folder for PNGs.
5. In your 3D View, set up a rough scene: add a camera, some geometry, and basic lighting.
6. In the **Generate** panel, enter a prompt. Keep it short and visual.
7. Click **Generate**.

Generations complete in under a minute on an RTX 4070 (12 GiB VRAM) at Full HD.

---

## 10. Advanced Settings

The Advanced / Performance section in the **Generate** panel exposes controls for performance, memory management, and model behavior.

### Collapsing the advanced section

The advanced section is collapsible via the section header in the Generate panel. Inside it, you will find generation parameters, LoRA controls, stream layers, flash attention, VRAM override, per-model device selection, and raw CLI editing.

### LoRA (Advanced Training Data)

- **Enabled by default**: selected via the `lora_enabled` checkbox.
- **LoRA Strength**: slider from 0.0 to 2.0. Default 1.0.
  - `0.0` effectively disables the adapter (vanilla FLUX).
  - `1.0` is the balanced trained state.
  - `> 1.0` increases scene-structure adherence; may reduce prompt flexibility.
  - `> 1.5` is likely to overfit the reference and ignore prompt direction.

### Stream Layers

When enabled, model weights are paged into GPU memory incrementally rather than loaded all at once. This reduces peak VRAM usage at the expense of longer generation times. Stream layers are most useful on GPUs with 4–8 GiB VRAM.

**Automatic enforcement**: when stream layers is turned on, the add-on pins all params backends to CPU automatically. When you disable stream layers, your previous device selections are restored.

### Flash Attention

Enables the flash attention kernel in `stable-diffusion.cpp` (CUDA-only). This can reduce peak VRAM usage and speed up generation. Not all CUDA-capable GPUs support flash attention; if you encounter errors, disable it.

### VRAM Override

If you want to constrain the backend's memory allocation manually, enable this field and enter your GPU's VRAM budget in GiB. The add-on passes this value to `stable-diffusion.cpp` via `--max-vram`.

### Per-model device offloading

Three sub-models can each be assigned independently:

| Sub-model | Options | Purpose |
|-----------|---------|---------|
| Diffusion | CUDA / CPU | Runtime device for the diffusion model |
| Text Encoder | CUDA / CPU | Runtime device for Qwen3-4B |
| VAE | CUDA / CPU / Disk | Runtime device for the VAE decoder |

| Sub-model | Options | Purpose |
|-----------|---------|---------|
| Diffusion Offload | Disk / CPU / CUDA | Where diffusion model weights are stored |
| Text Encoder Offload | Disk / CPU / CUDA | Where LLM weights are stored |
| VAE Offload | Disk / CPU / CUDA | Where VAE weights are stored |

Setting a params backend to Disk requires Stream Layers to be active; the add-on enforces this automatically.

### Raw CLI arguments

The **Raw Args** field in the advanced section is a single source of truth for generation parameters, expressed as `stable-diffusion.cpp` command-line arguments. It is editable directly in the UI or in the `D2AI_RawArgs` text block. The two representations are bidirectionally synced.

#### Available flags

| Flag | Default | Effect |
|------|---------|--------|
| `--seed N` | random | RNG seed for reproducibility |
| `--steps N` | 4 | Number of diffusion steps. Note: values above 4 do not produce materially higher quality for the FLUX-based pipeline. |
| `--backend device` | cuda0 | Runtime compute device. Options: `cuda0`, `cpu`. |
| `--params-backend spec` | cpu | Per-model weight storage. Format: `diffusion=M,te=V,vae=W` where M, V, W are `cuda0`, `cpu`, or `disk`. `te` is an alias for the text encoder (LLM). |
| `--stream-layers` | off | Enable incremental weight paging for low-VRAM operation. |
| `--diffusion-fa` / `--flash-attention` | off | Enable flash attention kernel. CUDA only. |
| `--max-vram N` | — | Manually set a VRAM budget in GiB. Passed to the backend as `cuda0=N`. Only included when the VRAM Override toggle is enabled. |

#### Example raw args

```
--seed 42 --steps 4 --backend cuda0 --stream-layers --diffusion-fa
```

#### Example with per-model params backends

```
--seed 42 --steps 4 --backend cuda0 --params-backend diffusion=cpu,te=cpu,vae=cuda0
```

### Custom model URLs

The add-on exposes URL fields for the diffusion model, LLM model, VAE, and LoRA adapter. These are pre-filled with bundled defaults. You can override them to point to compatible model files on other hosts. Backend package URL is also overridable for environments where the default GitHub-hosted package is inaccessible.

Paths resolve to:

- `%APPDATA%\3D2AI\dependencies\models\diffusion\`
- `%APPDATA%\3D2AI\dependencies\models\llm\`
- `%APPDATA%\3D2AI\dependencies\models\vae\`
- `%APPDATA%\3D2AI\dependencies\models\lora\`

### Error handling during generation

- Subprocess failures, backend crashes, and model loading errors are written to `scene.D2AI_last_error`.
- The Error Logs panel displays the truncated error message with a copy button.
- Download failures show in the Dependencies panel with a retry-capable error state and copy button.

---

## 11. Troubleshooting

### Dependencies panel shows "Partially Installed"

Check the error message in the Dependencies panel and in the Error Logs panel. Common causes:

- Disk space exhausted during download — free up space and click **Delete** then **Install** again.
- Network interruption — click **Install** to retry; the download system resumes from partial files.
- Antivirus blocking write access to `%APPDATA%\3D2AI\` — add an exclusion for that folder and retry.

### Generation fails with a subprocess error

1. Open the **Error Logs** panel and copy the error message.
2. Verify the stable-diffusion.cpp binary exists at the path shown in the Dependencies panel.
3. Confirm your NVIDIA driver supports CUDA 12 (`nvidia-smi`).
4. If you have less than 6 GiB VRAM, enable **Stream Layers**.
5. If the error persists with Stream Layers on, try **CPU** for the runtime backend to isolate a GPU driver issue.

### Out of memory (OOM)

- Enable **Stream Layers**.
- Lower the **Resolution Factor** in the Generate panel.
- Set **VRAM Override** to your GPU's known VRAM if you want to explicitly constrain the backend's memory allocation.
- Reduce the number of parallel operations by closing other GPU-intensive applications.

### Prompt seems ignored or image does not match scene

- Confirm the reference image was captured. The capture is required for conditioning. Without it, generation may fall back to text-only mode.
- Keep the prompt focused on detail that the reference does not fix (materials, lighting, mood). Do not restate camera position, object placement, or scene layout.
- Reduce LoRA Strength if the output is overfitting the greybox and ignoring your prompt.

### Captures look wrong or are blank

- Confirm you are in **Object Mode** when generating. The viewport capture draws the current shading mode.
- Ensure the camera is correctly framed. The capture uses the active viewport camera.
- If you are in Look Dev or Material Preview mode, those settings are captured as-is. Switch to Solid or Rendered for repeatable conditioning.

### Download is very slow

- The add-on automatically falls back to its mirror if primary sources are slow. If both are slow, your network may be congested. Downloads can be interrupted and resumed by clicking **Install** again.

---

## 12. License & Third-Party Components

### Add-on license

3D2AI is licensed under **GNU General Public License v3.0 or later** (GPL-3.0).

### Bundled third-party components

The add-on downloads and invokes the following external components at runtime. They are not distributed with the add-on source code; they are acquired by the add-on during the guided install.

| Component | License | Copyright | Source |
|-----------|---------|-----------|--------|
| stable-diffusion.cpp | MIT | leejet | github.com/leejet/stable-diffusion.cpp |
| FLUX.2-klein-4B GGUF | Apache 2.0 | Unsloth | huggingface.co/unsloth/FLUX.2-klein-4B-GGUF |
| Qwen3-4B GGUF | Apache 2.0 | Alibaba | huggingface.co/unsloth/Qwen3-4B-GGUF |
| FLUX.2-small-decoder (VAE) | Apache 2.0 | Black Forest Labs | huggingface.co/black-forest-labs/FLUX.2-small-decoder |
| 3D2AI LoRA (Flux_Klein_4B_3D2AI) | Apache 2.0 | Latentiq | huggingface.co/Latentiq/Flux2_Klein_4B_3D2AI_LoRA |

### License compatibility

MIT and Apache 2.0 licenses are compatible with GPL-3.0. The add-on communicates with the `stable-diffusion.cpp` backend via subprocess and command-line interface, which does not create a combined work under copyright law. Model files are data, not source code, and their Apache-2.0 licenses do not impose copyleft obligations on this add-on.

### Source code

The add-on source code is available in the release archive and in its development repository. Because the add-on is GPL-3.0 licensed, you have the right to inspect, modify, and redistribute the source in accordance with the license terms.
