import { BirthProfile } from "@/components/workspace/BirthProfile";
export default function SoulPage() {
  return (
    <div className="w-page">
      <div className="w-page-heading">
        <div>
          <span className="w-eyebrow">IDENTITÄT & SEELE</span>
          <h1>Erkenne deine Facetten.</h1>
          <p>
            Ein Kompass für Neugier, Selbsterkenntnis und bewusste
            Zusammenarbeit.
          </p>
        </div>
      </div>
      <BirthProfile />
    </div>
  );
}
