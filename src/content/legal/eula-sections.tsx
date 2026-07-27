import {
  LegalLi,
  LegalP,
  LegalStrong,
  LegalUl,
  type LegalSection,
} from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";

export const eulaSections: LegalSection[] = [
  {
    id: "license-grant",
    title: "License Grant",
    content: (
      <>
        <LegalP>
          This End User License Agreement (&ldquo;<LegalStrong>EULA</LegalStrong>
          &rdquo;) governs your download, installation, and use of the{" "}
          {LEGAL.productName} desktop application for macOS (and any related
          installers, updates, or documentation) (the &ldquo;
          <LegalStrong>Software</LegalStrong>&rdquo;). It forms part of your
          agreement with us under the{" "}
          <a href={LEGAL_ROUTES.terms} className="text-landed-600 underline">
            Terms of Service
          </a>
          . Capitalized terms not defined here have the meaning in the Terms.
        </LegalP>
        <LegalP>
          Subject to your compliance with this EULA, the Terms, and your plan
          entitlements, we grant you a limited, revocable, non-exclusive,
          non-transferable, non-sublicensable license to install and use the
          Software on devices you own or control, solely for your personal or
          internal business use of the Service.
        </LegalP>
      </>
    ),
  },
  {
    id: "ownership",
    title: "Ownership",
    content: (
      <>
        <LegalP>
          The Software is licensed, not sold. We and our licensors retain all
          right, title, and interest in and to the Software, including all
          intellectual property rights. No rights are granted except as
          expressly stated in this EULA.
        </LegalP>
      </>
    ),
  },
  {
    id: "restrictions",
    title: "Restrictions",
    content: (
      <>
        <LegalP>Except as permitted by mandatory law, you may not:</LegalP>
        <LegalUl>
          <LegalLi>
            Copy, modify, adapt, translate, or create derivative works of the
            Software;
          </LegalLi>
          <LegalLi>
            Reverse engineer, decompile, disassemble, or attempt to derive
            source code, models, or underlying ideas;
          </LegalLi>
          <LegalLi>
            Rent, lease, lend, sell, redistribute, or sublicense the Software;
          </LegalLi>
          <LegalLi>
            Circumvent license keys, entitlement checks, usage limits, or
            security controls;
          </LegalLi>
          <LegalLi>
            Remove or obscure proprietary notices; or
          </LegalLi>
          <LegalLi>
            Use the Software in violation of our{" "}
            <a
              href={LEGAL_ROUTES.acceptableUse}
              className="text-landed-600 underline"
            >
              Acceptable Use Policy
            </a>
            .
          </LegalLi>
        </LegalUl>
      </>
    ),
  },
  {
    id: "updates",
    title: "Updates and Versions",
    content: (
      <>
        <LegalP>
          We may provide updates, patches, or new versions. Some updates may be
          required for continued use or security. We may stop supporting older
          versions. Features may change between releases as described in the
          Terms.
        </LegalP>
      </>
    ),
  },
  {
    id: "third-party",
    title: "Third-Party Components",
    content: (
      <>
        <LegalP>
          The Software may include or link to third-party open-source or
          commercial components subject to their own licenses. Those licenses
          govern those components; this EULA governs our proprietary Software.
          Nothing here limits your rights under applicable open-source licenses.
        </LegalP>
      </>
    ),
  },
  {
    id: "privacy-data",
    title: "Privacy and Data",
    content: (
      <>
        <LegalP>
          Use of the Software involves processing described in our{" "}
          <a href={LEGAL_ROUTES.privacy} className="text-landed-600 underline">
            Privacy Policy
          </a>
          , including screen context and AI requests when you use those
          features. You are responsible for lawful use on shared devices and in
          workplaces.
        </LegalP>
      </>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    content: (
      <>
        <LegalP>
          This license ends automatically if you breach this EULA or the Terms,
          or if your account is suspended or terminated. On termination, you
          must stop using the Software and uninstall it. Sections that by their
          nature should survive (including ownership, disclaimers, and
          liability limits in the Terms) survive termination.
        </LegalP>
      </>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimer and Liability",
    content: (
      <>
        <LegalP>
          The Software is provided under the warranty disclaimers and liability
          limitations in the Terms, including the AI outputs disclaimer. To the
          maximum extent permitted by law, we disclaim all warranties not
          expressly stated in the Terms.
        </LegalP>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: (
      <>
        <LegalP>
          This EULA is governed by the laws of {LEGAL.jurisdiction.region}, as
          set out in the Terms, including the dispute-resolution provisions
          there.
        </LegalP>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <>
        <LegalP>
          Questions about this EULA: {LEGAL.contact.legal}.
        </LegalP>
      </>
    ),
  },
];
