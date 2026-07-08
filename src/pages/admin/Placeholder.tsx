import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

const Placeholder = ({ title, description }: { title: string; description?: string }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
    </div>
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <Construction className="w-6 h-6 text-secondary" />
        <CardTitle className="text-base">בפיתוח</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        המודול הזה ייבנה בשלב הבא של הפרויקט. התשתית ומסד הנתונים כבר מוכנים.
      </CardContent>
    </Card>
  </div>
);
export default Placeholder;
