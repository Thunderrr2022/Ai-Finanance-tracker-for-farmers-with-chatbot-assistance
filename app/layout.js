import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/context/LanguageContext";

// ⬇️ Import Chatbot
import FloatingButton from "@/components/chatbot/FloatingButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Welth",
  description: "One stop Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <LanguageProvider>
        <html lang="en">
          <head>
            <link rel="icon" href="/logo-sm.png" sizes="any" />
          </head>
          <body className={inter.className}>
            <Header />

            {/* Main content */}
            <main className="min-h-screen">{children}</main>

            {/* Toaster for alerts */}
            <Toaster richColors />

            {/* Floating Chatbot Button */}
            <FloatingButton />

            {/* Footer */}
            <footer className="bg-blue-50 py-12">
              <div className="container mx-auto px-4 text-center text-gray-600">
                <p>Made with 💗 by RoadsideCoder</p>
              </div>
            </footer>
          </body>
        </html>
      </LanguageProvider>
    </ClerkProvider>
  );
}
