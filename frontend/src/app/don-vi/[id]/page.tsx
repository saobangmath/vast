import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { findUnit, parseUnit, titleCase } from "@/lib/content";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = findUnit((await params).id);
  return { title: f ? `${titleCase(f.unit.name)} | VAST` : "Không tìm thấy | VAST" };
}

const isHttp = (v: string) => /^(www\.|https?:)/i.test(v) || /\.(vn|org|com|edu)(\/|$)/i.test(v);
const href = (v: string) => (v.startsWith("http") ? v : `https://${v.replace(/^\/+/, "")}`);

function Lines({ lines }: { lines: string[] }) {
  return (
    <div className="lines">
      {lines.map((l, i) => {
        const m = l.match(/^([^:]{2,45}):\s*(.+)$/);
        const item = /^(?:[•\-–]|\d+[.)]|[a-zđ]\))\s*/.test(l);
        return (
          <p key={i} className={item ? "ln ln--item" : "ln"}>
            {m && !item ? (
              <>
                <b>{m[1]}:</b> {m[2]}
              </>
            ) : (
              l.replace(/^[•–-]\s*/, "")
            )}
          </p>
        );
      })}
    </div>
  );
}

export default async function UnitPage({ params }: Props) {
  const found = findUnit((await params).id);
  if (!found) notFound();
  const { unit, group } = found;
  const v = parseUnit(unit.html);
  const siblings = group.units.filter((u) => u.id !== unit.id).slice(0, 6);
  const keyFacts = v.facts.filter((f) => f.label);

  return (
    <>
      <PageHero
        eyebrow={group.name}
        title={titleCase(unit.name)}
        subtitle={v.facts.find((f) => /Trụ sở/i.test(f.label))?.value}
        crumbs={[
          { label: "Cơ cấu tổ chức", href: "/co-cau-to-chuc" },
          { label: group.name, href: `/co-cau-to-chuc/${group.key}` },
          { label: titleCase(unit.name) },
        ]}
        aside={
          unit.image && (
            <Image className="hero-thumb" src={unit.image} alt="" width={480} height={320} sizes="320px" />
          )
        }
      />

      <div className="wrap portal-main page-body">
        <div className="unit-layout">
          <div className="unit-main">
            {keyFacts.filter((f) => !/Trụ sở/i.test(f.label)).length > 0 && (
              <div className="fact-grid">
                {keyFacts
                  .filter((f) => !/Trụ sở/i.test(f.label))
                  .map((f) => (
                    <div key={f.label} className="fact">
                      <span>{f.label}</span>
                      <b>{f.value}</b>
                    </div>
                  ))}
              </div>
            )}

            {v.blocks.map((b) => (
              <section key={b.title} className="unit-block">
                <h2>{titleCase(b.title)}</h2>
                <Lines lines={b.lines} />
              </section>
            ))}
            {v.blocks.length === 0 && v.leaders.length === 0 && (
              <p className="meta">Thông tin chi tiết đang được cập nhật.</p>
            )}
          </div>

          <aside className="unit-aside">
            {(v.address || v.contact.length > 0) && (
              <div className="panel">
                <h3>Liên hệ</h3>
                <dl className="contact-list">
                  {v.address && (
                    <>
                      <dt>Địa chỉ</dt>
                      <dd>{v.address}</dd>
                    </>
                  )}
                  {v.contact.map((c) => (
                    <div key={c.label + c.value} className="contact-row">
                      <dt>{c.label}</dt>
                      <dd>
                        {/^email/i.test(c.label) ? (
                          <a href={`mailto:${c.value}`}>{c.value}</a>
                        ) : /web/i.test(c.label) && isHttp(c.value) ? (
                          <a href={href(c.value)} target="_blank" rel="noopener noreferrer">
                            {c.value}
                          </a>
                        ) : (
                          c.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {v.leaders.length > 0 && (
              <div className="panel">
                <h3>Ban lãnh đạo</h3>
                {v.leaders.map((l) => (
                  <div key={l.role} className="leader-row">
                    <span>{l.role}</span>
                    {l.names.map((n) => (
                      <b key={n}>{n}</b>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {siblings.length > 0 && (
              <div className="panel">
                <h3>{group.name}</h3>
                <ul className="list">
                  {siblings.map((s) => (
                    <li key={s.id}>
                      <Link href={`/don-vi/${s.id}`}>{titleCase(s.name)}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
