# Overview

This web app provides a simplified interface for using Stable Diffusion,
utilizing the API of [AUTOMATIC1111's Stable Diffusion Web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui).

The purpose is to deliver a watered-down feature set, making life easier
for beginners and anyone who is looking for a cleaner and simpler interface.

The app is served at https://simplematic.web.app

# Features

- Text-to-Image
  - Basic sizes.
  - Prompt, negative prompt, steps, CFG scale, seed, sampler (in side menu).
  - Face restoration.
  - HiRes upscaling (Latent).
- Image-to-Image
  - Upload an image or send from txt2img.
  - Supports denoising strength and 3 resize modes.
- Gallery
  - Save images along with parameters, including img2img's source image.
  - Hashtags filtering.
  - Pagination.
- Upscaler
  - Upload an image or send from txt2img.
  - Supports 1 and 2 upscalers with visibility.
  - Supports CodeFormer and GFPGAN visibilities.
- Import PNG & parameters.

## Screenshots

<p align="left">
  <img src="screenshots/txt2img.jpeg" width="200" alt="Text to Image"/>
  <img src="screenshots/img2img.jpeg" width="200" alt="Image to Image"/>
  <img src="screenshots/result-1.jpeg" width="200" alt="Image to Image Result"/>
  <img src="screenshots/result-2.jpeg" width="200" alt="Text to Image Result"/>
  <img src="screenshots/result-3.jpeg" width="200" alt="Text to Image Result"/>
  <img src="screenshots/upscale.jpeg" width="200" alt="Upscaling Image"/>
  <img src="screenshots/gallery.jpeg" width="200" alt="Image Gallery"/>
  <img src="screenshots/import.jpeg" width="200" alt="Import Parameters"/>
</p>

# Setup

This app requires a running instance of AUTOMATIC1111's Web UI.
The following command line arguments are necessary:

- `--api`: to enable API requests.
- `--share`: to create a Gradio public URL.
- OR `--ngrok your_ngrok_token`: to establish a tunnel using [ngrok](https://ngrok.com) service. (Not sponsored.)
- `--cors-allow-origins=https://simplematic.web.app`: to allow requests from this app.

You might want to add `--ngrok-region` to optimize connection speed.
See their [docs](https://ngrok.com/docs/platform/pops/) for more details.

Also, you can add `--api-auth username:password` to add a basic authorization layer.
Furthermore, add `--no-webui` to completely prevent other parties from using your instance.
But that also means you won't be able to use the Web UI either.

When the Web UI instance is ready, copy the provided Gradio or ngrok link and
paste it into the URL input in Settings screen. Enter username and password if
any, then click SAVE. If the setup is correct, the app will connect to your
instance and start fetching models as well as sampler list.

# Contribute

I don't have too much free time but will try to review issues and merge pull requests
that are useful and don't make too many changes.

# About me

My name's Cintam. I code to make a living and do arts to have a life.
I made this app to learn AI and other coding stuffs.
