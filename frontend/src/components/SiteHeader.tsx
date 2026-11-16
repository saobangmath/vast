"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { NAV, VAST } from "@/lib/nav";

/**
 * Site header: a single row (logo left, menu right) that shrinks and blurs once the page is
 * scrolled. A thin national strip sits above it. On small screens the menu is a hamburger.
 */

function useScrolled(threshold: number) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > threshold);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [threshold]);
  return scrolled;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled(24);
  const items = NAV.slice(1); // the logo already links to the homepage

  return (
    <>
      <a className="skip" href="#main">
        Bỏ qua, đến nội dung chính
      </a>

      <div className="nat-strip">
        <div className="wrap">
          <span>Cộng hòa Xã hội Chủ nghĩa Việt Nam</span>
          <a href={VAST} target="_blank" rel="noopener noreferrer">
            vast.gov.vn
          </a>
        </div>
      </div>

      <header className={`hdr hdr--blur${scrolled ? " hdr--shrunk" : ""}${open ? " is-open" : ""}`}>
        <div className="wrap hdr-row">
          <Link href="/" className="hdr-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vast-logo.png" alt="Logo Viện Hàn lâm Khoa học và Công nghệ Việt Nam" />
            <span>
              <b>Viện Hàn lâm KH&amp;CN Việt Nam</b>
              <small>Vietnam Academy of Science and Technology</small>
            </span>
          </Link>

          <nav className="hnav" aria-label="Điều hướng chính">
            <ul>
              {items.map((item) => (
                <li key={item.label}>
                  <NavLink href={item.href} className="hnav-top">
                    {item.short ?? item.label}
                  </NavLink>
                  {item.children && (
                    <div className="sub">
                      {item.children.map((c) => (
                        <NavLink key={c.label} href={c.href}>
                          {c.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="hdr-tools">
            <Link href="/lien-he">Liên hệ</Link>
            <div className="lang" aria-label="Ngôn ngữ">
              <a className="on" href="#">
                VI
              </a>
              <a href="#">EN</a>
            </div>
          </div>

          <button type="button" className="burger" aria-label="Mở menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
    </>
  );
}
