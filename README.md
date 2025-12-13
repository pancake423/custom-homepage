# About

This project is a static offline-usable website designed to be used as a browser homepage.

It includes:
- a customizable links page for quickly navigating to frequently used websites
- a notes app
- highly customizable color schemes

# Installing

## 1.
Serve this directory as a static website. The recommended way is with npx (comes with every [Node.js](https://nodejs.org/en/download) installation). In the terminal:

```bash
# clone the repo.
# (you could also download as a zip folder, extract, and open a terminal in that folder)
git clone https://github.com/pancake423/custom-homepage.git
cd custom-homepage

# serve the static website
npx serve public -p 51432 # choose a port number that you're unlikely to ever use again
```

## 2.
In your browser settings, find the homepage settings and set it to the custom url from above (http://localhost:51432).

### Firefox
go to `about:preferences#home`.

<img src="images/screenshot-firefox.png" width = 800>

### Chrome

go to `chrome://settings/appearance`. turn on "show home button", and set it to the custom url.

<img src="images/screenshot-chrome.png" width = 800>

### Other Browsers

 Most (all?) browsers support custom homepages. Look up specific instructions online if you're having trouble.

## 3.
Visit your new homepage at least once before closing the terminal. The page has a service worker that will let it run offline
after it has been loaded once.

# Attributions

Icons from [Bootstrap](https://icons.getbootstrap.com/) and [SVGRepo](https://www.svgrepo.com/)
