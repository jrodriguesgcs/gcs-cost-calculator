import { NextRequest, NextResponse } from "next/server";
import { getProgram, slugifyProgramName } from "@/lib/programs/registry";
import { ProgramVariableValues } from "@/lib/programs/types";
import { renderQuoteToPdf } from "@/lib/pdf/render-pdf";

// Generous timeout headroom for cold-started serverless Chromium launches.
export const maxDuration = 60;

interface GeneratePdfRequestBody {
  programSlug: string;
  clientName: string;
  variables: ProgramVariableValues;
}

export async function POST(request: NextRequest) {
  let body: GeneratePdfRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { programSlug, clientName, variables } = body;

  if (!programSlug || typeof programSlug !== "string") {
    return NextResponse.json({ error: "programSlug is required." }, { status: 400 });
  }
  if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
    return NextResponse.json({ error: "clientName is required." }, { status: 400 });
  }

  const program = getProgram(programSlug);
  if (!program) {
    return NextResponse.json({ error: `Unknown program "${programSlug}".` }, { status: 404 });
  }

  const quote = program.calculator.computeQuote(variables ?? {}, clientName.trim());

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderQuoteToPdf(quote);
  } catch (error) {
    console.error("PDF generation failed", error);
    return NextResponse.json({ error: "PDF generation failed." }, { status: 500 });
  }

  const programNameSlug = slugifyProgramName(program.config.name);
  const clientNameSlug = clientName.trim().replace(/\s+/g, "-");
  const filename = `GCS_Estimate_${programNameSlug}_${clientNameSlug}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
