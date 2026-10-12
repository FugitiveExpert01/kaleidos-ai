# 3D2AI

3D2AI is for 3D artists, not AI engineers.

3D2AI turns a blocked-out Blender scene into a generated image, without ever leaving the viewport. Enter a prompt, hit generate, done.

[insert image]

## Why 3D2AI

Once your composition is blocked out, you can test directions before committing. A full render is overkill here. Type a prompt, hit generate, and quickly get a direction to react to.

Instead of wrestling with local setup or bouncing to cloud tools, 3D2AI runs inside Blender and stays local, so you can keep momentum and iterate without breaking flow.

## The Story Behind It

I wanted AI control that was fast, local, and frictionless inside the tool I already knew: Blender. AI is genuinely useful for concepting, but only when artists can direct it with intent.

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

3D2AI is actively maintained, with user-requested improvements and support for new open generation models as they mature.

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
