import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrainTravel — Indian Train Ticket Booking',
  description: 'Book Indian train tickets fast with live seat availability, PNR tracking, and instant auto-refunds.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
