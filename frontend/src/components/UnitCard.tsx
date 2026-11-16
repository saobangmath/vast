import Image from "next/image";
import Link from "next/link";
import { titleCase, type Unit } from "@/lib/content";

const initials = (name: string) =>
  titleCase(name)
    .split(" ")
    .filter((w) => /^\p{Lu}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

/** Card for an organisation unit (institute, office, centre…). */
export function UnitCard({ unit }: { unit: Unit }) {
  return (
    <Link href={`/don-vi/${unit.id}`} className="ucard">
      {unit.image ? (
        <Image className="ucard-img" src={unit.image} alt="" width={560} height={350} sizes="(max-width: 640px) 100vw, 360px" />
      ) : (
        <div className="ucard-img ucard-ph" aria-hidden>
          {initials(unit.name)}
        </div>
      )}
      <div className="ucard-body">
        <h3>{titleCase(unit.name)}</h3>
        <span className="ucard-more">Xem chi tiết →</span>
      </div>
    </Link>
  );
}
