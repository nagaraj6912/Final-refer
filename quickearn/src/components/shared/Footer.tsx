import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer p-10 bg-base-200 text-base-content mt-16">
      <nav>
        <header className="footer-title">QuickEarn</header>
        <Link href="/categories" className="link link-hover">Categories</Link>
        <Link href="/blog" className="link link-hover">Blog</Link>
        <Link href="/quiz" className="link link-hover">Referral Quiz</Link>
      </nav>
      <nav>
        <header className="footer-title">Legal</header>
        {/* TODO: Create these legal pages */}
        <Link href="/privacy" className="link link-hover">Privacy Policy</Link>
        <Link href="/terms" className="link link-hover">Terms of Service</Link>
        <Link href="/disclosure" className="link link-hover">Affiliate Disclosure</Link>
      </nav>
      <aside>
        <p>Copyright © {new Date().getFullYear()} - All right reserved by QuickEarn</p>
        <p className="text-xs mt-2">
          We may earn a commission from apps you sign up for through our links.
        </p>
      </aside>
    </footer>
  );
}
