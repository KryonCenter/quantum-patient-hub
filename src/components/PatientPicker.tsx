import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { fullName, type Patient } from "@/lib/types";

interface Props {
  patients: Patient[];
  value: string;
  onChange: (id: string) => void;
}

export function PatientPicker({ patients, value, onChange }: Props) {
  const [q, setQ] = useState("");
  const selected = patients.find((p) => p.id === value);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return patients.slice(0, 8);
    return patients
      .filter(
        (p) =>
          fullName(p).toLowerCase().includes(term) ||
          (p.telefono || "").toLowerCase().includes(term) ||
          (p.correo || "").toLowerCase().includes(term),
      )
      .slice(0, 12);
  }, [patients, q]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="pl-9"
        />
      </div>
      {selected && (
        <div className="text-xs text-primary">
          ✓ Seleccionado: {fullName(selected)} {selected.telefono ? `· ${selected.telefono}` : ""}
        </div>
      )}
      <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
        {matches.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground text-center">Sin coincidencias</div>
        ) : (
          matches.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => onChange(p.id)}
              className={`w-full text-left p-2 hover:bg-accent text-sm ${value === p.id ? "bg-accent" : ""}`}
            >
              <div className="font-medium">{fullName(p)}</div>
              <div className="text-xs text-muted-foreground">
                {p.telefono || "Sin teléfono"} {p.correo ? `· ${p.correo}` : ""}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
