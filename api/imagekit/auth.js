import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

export default async function handler(req, res) {
  try {
    const result = imagekit.getAuthenticationParameters();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    return res.status(200).send(JSON.stringify({
      ...result,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || ''
    }));
  } catch (error) {
    console.error('Error generating ImageKit auth parameters:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).send(JSON.stringify({ error: 'Failed to generate auth parameters' }));
  }
}
