# 3D2AI

3D2AI is for 3D artists, not AI engineers.

3D2AI turns a blocked-out Blender scene into a generated image, without ever leaving the viewport. Enter a prompt, hit generate, done.

[insert image]

## Why 3D2AI

You've blocked out a composition and you want to see where it could go before you commit. A full render is overkill for that; you just want to explore. Type a prompt, hit generate, and in under a minute you have a new direction to react to.

Most local AI tools turn you into a part-time systems administrator before you even get to make anything: Python environments, dependency conflicts, command-line installs. The alternative is a cloud subscription, where your scenes leave your machine and every generation means tabbing out of Blender and losing your train of thought.

3D2AI skips both problems. It's local, it's built into Blender, and it's ready in a couple of clicks.

## The Story Behind It

I wanted a way to control AI output that was fast, local, and didn't fight me for it, using the tool I already knew best: Blender. AI is a genuinely useful tool for concepting and ideation, but only in the hands of an artist who knows what they're doing. Without that, it's worthless.

Nothing like that existed, so I built it myself.

## How It Works

You shape the scene, direct the composition, and write the prompt. 3D2AI takes it from there, turning your decisions into a finished image.

It's been fine-tuned on a mix of synthetic and real Blender scene data, so it holds onto your scene's structure and composition instead of drifting away from it.

## What It Helps With

* Exploring mood, lighting, and visual direction early in a project without committing to a full render
* Testing how a scene reads before you lock anything in
* Generating concept frames for client or pitch work, directly from your working file
* Moving through multiple creative directions in the time it would normally take to render one

## Local by Design

Nothing leaves your machine: your scenes, prompts, and results stay in your project folder, never uploaded or used to train someone else's model.

## No Subscriptions

3D2AI is a one time purchase. No subscription, no recurring fees. Own it once, keep it forever.

## Always Improving

3D2AI is actively maintained. Updates add features requested by the people actually using it, and bring support for new state-of-the-art open generation models as they're released, so your setup keeps pace with the tools instead of falling behind them.

## User Interface

[Screenshot: 3D2AI panel inside Render Properties]
[Screenshot: prompt field and generation controls]
[Screenshot: output path and resolution settings]

## System Requirements

* OS: Windows x64 only
* GPU: Nvidia, with CUDA 12 or newer
* VRAM: 8 GB (for high quality Full HD output)
* System memory: around 16 GB
* Blender: 4.2 LTS and above

Support for other platforms and GPU vendors is something we're looking at for future updates.

## Installation

1. Install the add-on in Blender.
2. Enable 3D2AI in Preferences.
3. Open the 3D2AI panel in Render Properties.
4. Run the guided installer. It handles setup automatically (6.13 GB total, including all models and dependencies).
5. Choose your output path, enter your prompt, and generate.
