const fs = require('fs');

// Navbar.tsx
let navbar = fs.readFileSync('src/components/Navbar.tsx', 'utf8');
navbar = navbar.replace("import { useAuth } from '../contexts/AuthContext';", "import { useAuth } from '../contexts/AuthContext';\nimport { useSiteSettings } from '../contexts/SiteSettingsContext';");
navbar = navbar.replace("const { user, profile, isAdmin } = useAuth();", "const { user, profile, isAdmin } = useAuth();\n  const { settings } = useSiteSettings();");
// Navbar logos
navbar = navbar.replace(/src="\/logo\.png"/g, 'src={settings.logoUrl || "/logo.png"}');
fs.writeFileSync('src/components/Navbar.tsx', navbar);

// SEOHead.tsx
let seo = fs.readFileSync('src/components/SEOHead.tsx', 'utf8');
seo = seo.replace("import { Helmet } from 'react-helmet-async';", "import { Helmet } from 'react-helmet-async';\nimport { useSiteSettings } from '../contexts/SiteSettingsContext';");
seo = seo.replace("export const SEOHead: React.FC<SEOProps> = ({", "export const SEOHead: React.FC<SEOProps> = ({\n");
seo = seo.replace("image = 'https://www.laksub.com/logo.png',", "image,\n");
seo = seo.replace("type = 'website',", "type = 'website',\n");
seo = seo.replace("}) => {", "}) => {\n  const { settings } = useSiteSettings();\n  const finalImage = image || settings.logoUrl || 'https://www.laksub.com/logo.png';\n");
seo = seo.replace(/content=\{image\}/g, "content={finalImage}");
seo = seo.replace("href=\"/favicon.png\"", "href={settings.faviconUrl || \"/favicon.png\"}");
fs.writeFileSync('src/components/SEOHead.tsx', seo);

console.log('Updated Navbar and SEOHead');
