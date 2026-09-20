
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import { TechnicalReportModal } from "./components/modals/TechnicalReportModal";
import { ComponentDatasheetModal } from "./components/modals/ComponentDatasheetModal";
import { CatalogExplorerModal } from "./components/modals/CatalogExplorerModal";
import { SystemCheckModal } from "./components/modals/SystemCheckModal";
import { GlobalBomModal } from "./components/modals/GlobalBomModal";
import { MaxStopModal } from "./components/modals/MaxStopModal";
import { CamTableManagerModal } from "./components/modals/CamTableManagerModal";
import { DocModal } from "./components/modals/DocModal";
import { AboutModal } from "./components/modals/AboutModal";
import { initialData } from "./initialData";
import { getFullMotorCatalog, getFullDriveCatalog, getFullGearboxCatalog } from "./catalogData";

describe("Complete UI Render Verification", () => {
  it("renders main App without crashing", () => {
    const html = renderToString(<App />);
    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(100);
  });

  it("renders TechnicalReportModal without crashing", () => {
    const html = renderToString(<TechnicalReportModal isOpen={true} onClose={() => {}} data={initialData} />);
    expect(html).toBeDefined();
    expect(html).toContain("4. Certified Component Technical Datasheets");
  });

  it("renders ComponentDatasheetModal for motor, drive, gearbox", () => {
    const motor = getFullMotorCatalog()[0];
    const drive = getFullDriveCatalog()[0];
    const gearbox = getFullGearboxCatalog()[0];

    const motorHtml = renderToString(<ComponentDatasheetModal isOpen={true} onClose={() => {}} type="motor" motor={motor} appliedRadialForce={250} />);
    expect(motorHtml).toContain("ISO 281");

    const driveHtml = renderToString(<ComponentDatasheetModal isOpen={true} onClose={() => {}} type="drive" drive={drive} />);
    expect(driveHtml).toBeDefined();

    const gbHtml = renderToString(<ComponentDatasheetModal isOpen={true} onClose={() => {}} type="gearbox" gearbox={gearbox} appliedRadialForce={500} />);
    expect(gbHtml).toContain("ISO 281");
  });

  it("renders CatalogExplorerModal without crashing", () => {
    const html = renderToString(
      <CatalogExplorerModal
        isOpen={true}
        onClose={() => {}}
        onSelectMotor={() => {}}
        onSelectDrive={() => {}}
        onSelectGearbox={() => {}}
      />
    );
    expect(html).toBeDefined();
  });

  it("renders other auxiliary modals without crashing", () => {
    expect(renderToString(<SystemCheckModal isOpen={true} onClose={() => {}} data={initialData} />)).toBeDefined();
    expect(renderToString(<GlobalBomModal isOpen={true} onClose={() => {}} data={initialData} />)).toBeDefined();
    expect(renderToString(<MaxStopModal isOpen={true} onClose={() => {}} data={initialData} />)).toBeDefined();
    expect(renderToString(<CamTableManagerModal isOpen={true} onClose={() => {}} />)).toBeDefined();
    expect(renderToString(<DocModal isOpen={true} onClose={() => {}} />)).toBeDefined();
    expect(renderToString(<AboutModal isOpen={true} onClose={() => {}} />)).toBeDefined();
  });
});
