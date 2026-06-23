export const metadata = {
  title: "Verifyd - Is this a scam?",
  description: "Paste any suspicious message and instantly find out if it is a scam.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
