import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { getPages, parseContact, titleCase } from "@/lib/content";

export const metadata: Metadata = { title: "Liên hệ | VAST" };

const ICONS: Record<string, string> = {
  "Địa chỉ": "M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  Email: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l9 6 9-6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
};
const iconFor = (label: string) => (/email/i.test(label) ? ICONS.Email : /địa chỉ/i.test(label) ? ICONS["Địa chỉ"] : ICONS.phone);

export default function ContactPage() {
  const cards = parseContact(getPages().contact);
  return (
    <>
      <PageHero
        eyebrow="Kết nối"
        title="Liên hệ"
        subtitle="Thông tin liên hệ Văn phòng Viện Hàn lâm và đơn vị quản trị nội dung Cổng thông tin điện tử."
        crumbs={[{ label: "Liên hệ" }]}
      />
      <div className="wrap portal-main page-body">
        <div className="contact-grid">
          {cards.map((c) => (
            <article key={c.title} className="contact-card">
              <h2>{titleCase(c.title)}</h2>
              {c.note.map((n) => (
                <p key={n} className="meta">
                  {n}
                </p>
              ))}
              <ul>
                {c.lines.map((l) => (
                  <li key={l.label + l.value}>
                    <span className="ico">
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d={iconFor(l.label)} />
                      </svg>
                    </span>
                    <div>
                      <span className="meta">{l.label}</span>
                      {/email/i.test(l.label) ? <a href={`mailto:${l.value}`}>{l.value}</a> : <b>{l.value}</b>}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
