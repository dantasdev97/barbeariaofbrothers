import { UnitForm } from "../unit-form";

export default function NewUnitPage() {
  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">Nova unidade</h1>
        <p className="text-sm text-muted-foreground">
          Crie uma nova barbearia.
        </p>
      </header>
      <UnitForm />
    </div>
  );
}
