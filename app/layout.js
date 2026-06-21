export const metadata = {
  title: 'Scam Message Checker — Is this a scam?',
  description: 'Paste any suspicious text, email, or DM and instantly see if it shows signs of being a scam or manipulation attempt.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/@tabler/icons-webfont/2.47.0/tabler-icons.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
