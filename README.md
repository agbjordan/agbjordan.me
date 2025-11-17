# Portfolio Website

A modern, responsive portfolio website hosted on GitHub Pages.

## Features

- Responsive design that works on all devices
- Smooth scrolling navigation
- Mobile-friendly hamburger menu
- Clean and professional layout
- Easy to customize

## Customization

### Update Your Information

1. **index.html**: Replace placeholder text with your information
   - Update "Your Name" with your actual name
   - Modify the hero subtitle
   - Add your projects with descriptions and links
   - Update skills to match your expertise
   - Replace contact links (email, GitHub, LinkedIn, Twitter)

2. **css/style.css**: Customize colors and styling
   - Modify CSS variables in `:root` to change the color scheme
   - Adjust fonts, spacing, and other styles as needed

3. **js/main.js**: Add additional interactivity if desired

## GitHub Pages Deployment

### Option 1: Deploy from main branch

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to your repository on GitHub
3. Click on "Settings"
4. Scroll down to "Pages" in the left sidebar
5. Under "Source", select "main" branch
6. Click "Save"
7. Your site will be published at `https://yourusername.github.io/repository-name/`

### Option 2: Custom domain

If you want to use a custom domain (like `www.yourname.com`):

1. Create a file named `CNAME` in the root directory with your domain:
   ```
   www.yourname.com
   ```

2. Configure your domain's DNS settings:
   - Add a CNAME record pointing to `yourusername.github.io`
   - Or add A records pointing to GitHub's IP addresses

3. In your repository settings under "Pages", enter your custom domain

## Local Development

To test your site locally:

1. Open `index.html` directly in your browser, or
2. Use a simple HTTP server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000

   # Node.js (if you have npx)
   npx http-server
   ```

3. Visit `http://localhost:8000` in your browser

## File Structure

```
.
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Styles
├── js/
│   └── main.js        # JavaScript functionality
├── .nojekyll          # Tells GitHub Pages not to use Jekyll
└── README.md          # This file
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Feel free to use this template for your own portfolio!
