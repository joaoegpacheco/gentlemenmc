"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const DOCUMENTS = {
  estatuto: "/estatuto.pdf",
  regimento: "/regimento.pdf",
} as const;

type DocumentKey = keyof typeof DOCUMENTS;

function PdfViewer({ path, downloadLabel, notSupportedLabel, downloadFallback }: {
  path: string;
  downloadLabel: string;
  notSupportedLabel: string;
  downloadFallback: string;
}) {
  return (
    <object
      key={path}
      data={path}
      type="application/pdf"
      style={{ width: "100%", height: "500px" }}
    >
      <p>
        {notSupportedLabel}{" "}
        <a href={path}>{downloadLabel}</a> {downloadFallback}
      </p>
    </object>
  );
}

const ByLaw = () => {
  const t = useTranslations("byLaw");
  const [activeDoc, setActiveDoc] = useState<DocumentKey>("estatuto");

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={activeDoc}
        onValueChange={(value) => setActiveDoc(value as DocumentKey)}
      >
        <TabsList>
          <TabsTrigger value="estatuto">{t("estatuto")}</TabsTrigger>
          <TabsTrigger value="regimento">{t("regimentoInterno")}</TabsTrigger>
        </TabsList>
        {(Object.keys(DOCUMENTS) as DocumentKey[]).map((key) => (
          <TabsContent key={key} value={key}>
            <PdfViewer
              path={DOCUMENTS[key]}
              downloadLabel={t("downloadLink")}
              notSupportedLabel={t("pdfNotSupported")}
              downloadFallback={t("downloadFallback")}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ByLaw;
