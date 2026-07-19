import {
  LegalH3,
  LegalLi,
  LegalLink,
  LegalOl,
  LegalP,
  LegalStrong,
  LegalTable,
  LegalUl,
  type LegalSection,
} from "@/components/legal/LegalDocument";
import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";

export const privacySections: LegalSection[] = [
  {
    id: "scope-and-applicability",
    title: "Scope and Applicability",
    content: (
      <>
        <LegalP>
          The Policy applies to your information when you visit our website or
          otherwise use the Services. This Policy does not apply to the extent
          that we process Personal Information in the role of a processor (or a
          comparable role such as a &ldquo;service provider&rdquo; in certain
          jurisdictions) on behalf of our Customers, including where we collect
          Customer Data on behalf of our Customers, or where our Customers
          otherwise collect, use, share or process Personal Information via our
          Services.
        </LegalP>
        <LegalP>
          Each of our Customers, not Landed, controls what information about you
          is collected by the Services on behalf of such Customer. For detailed
          privacy information applicable to situations where a Customer who uses
          the Services is the controller, please reach out to the respective
          customer directly. We are not responsible for the privacy or data
          security practices of our Customers, which may differ from those set
          forth in this Privacy Policy.
        </LegalP>
        <LegalP>
          This Privacy Policy also does not apply to any third-party
          applications or services that are used in connection with our Services,
          or any other products, services or accounts provided by other entities
          under their own terms of service and privacy policy (collectively,
          &ldquo;Third-Party Services&rdquo;). The Site or Services may contain
          links to other websites. We have no control over these websites and
          they are subject to their own terms of use and privacy policies.
        </LegalP>
      </>
    ),
  },
  {
    id: "what-information-do-we-collect",
    title: "What Information Do We Collect?",
    content: (
      <>
        <LegalH3>Information You Provide to Us</LegalH3>
        <LegalUl>
          <LegalLi>
            <LegalStrong>Account Information.</LegalStrong> To create an account
            for the Services or to enable certain features, we may require that
            you provide us with information for your account such as name, email,
            profile picture, password, and authentication credentials.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Payment Information.</LegalStrong> If you sign up for a
            paid subscription, we (or our payment processors) may need your
            billing details such as credit card information, banking information,
            and billing address. Your payment information is collected and stored
            by our third party payment processing company (the &ldquo;Payment
            Processor&rdquo;). As of the Effective Date of this Privacy Policy,
            Stripe is the Payment Processor used within the Services and its
            privacy policy is available at{" "}
            <LegalLink href="https://stripe.com/privacy">
              https://stripe.com/privacy
            </LegalLink>
            . We collect and store your credit card type, the last four digits of
            your credit card number, and expiration date, but no other financial
            information.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Recordings and Other Customer Data.</LegalStrong> In
            using our Services, our customers may submit or upload, or instruct
            Landed to collect, audio recordings, transcriptions, screen captures,
            seek customer support, or provide other Customer Data (defined in
            our Terms of Service) to us. Our use of and processing of Customer
            Data is governed by our Terms of Service or other services agreement
            with the Customer.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Business Contact Information.</LegalStrong> If you are a
            business representative, we collect your information in connection
            with the performance of the agreement or potential agreement with
            us. This information may include your first name, last name, contact
            information (e.g., email, phone, address), job title, and any other
            information related to the performance of the agreement with us.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Other Information You Provide.</LegalStrong> We receive
            other information from you when you choose to interact with us in
            other ways, such as if you sign up for one of our webinars or
            newsletters, participate in a research study or event, or otherwise
            communicate with us.
          </LegalLi>
        </LegalUl>

        <LegalH3>Information We Collect Automatically</LegalH3>
        <LegalP>
          When you visit, use, and interact with the Services, we may receive the
          following information about your visit, use, or interactions
          (&ldquo;Technical Information&rdquo;):
        </LegalP>
        <LegalUl>
          <LegalLi>
            <LegalStrong>Log Data.</LegalStrong> Information that your browser
            automatically sends whenever you use our website (&ldquo;log
            data&rdquo;). Log data includes your internet protocol address,
            browser type and settings, the date and time of your request, and
            how you interacted with our website.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Usage Data.</LegalStrong> We may automatically collect
            information about your use of the Services, such as the types of
            content that you view or engage with, the features you use and the
            actions you take, as well as your time zone, country, the dates and
            times of access, user agent and version, type of computer or mobile
            device, computer connection, IP address, and the like.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Device Information.</LegalStrong> Includes name of the
            device, operating system, and browser you are using. Information
            collected may depend on the type of device you use and its settings.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Analytics.</LegalStrong> We may use a variety of online
            analytics products that use cookies to help us analyze how users use
            our Services and enhance your experience when you use the Services.
          </LegalLi>
        </LegalUl>
        <LegalP>
          We use cookies and other tracking technologies to help us collect and
          process Technical Information. Please see the &ldquo;How Do We Use
          Tracking Technologies&rdquo; section below for more information.
        </LegalP>

        <LegalH3>Information We Receive from Third Parties</LegalH3>
        <LegalUl>
          <LegalLi>
            <LegalStrong>Third-Party Authentication.</LegalStrong> If you sign up
            or login to our Services using one of our sign-on providers (e.g.,
            Google), we collect authentication information provided to us by the
            provider to allow you to log in.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Marketing Information.</LegalStrong> We may receive
            marketing or demographic information about you from third parties or
            partners, for example, data about your organization or industry or
            other public information from sources like social media or online
            professional profiles.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Service Providers.</LegalStrong> We may receive
            information from our service providers, who help us operate our
            business.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Information from Other Sources.</LegalStrong> We may
            obtain information from other sources, including publicly available
            sources, third-party data providers, brand partnerships, and
            third-party integrations you consent to, or through transactions
            such as mergers and acquisitions.
          </LegalLi>
        </LegalUl>
      </>
    ),
  },
  {
    id: "how-do-we-use-the-information-we-collect",
    title: "How Do We Use The Information We Collect?",
    content: (
      <>
        <LegalP>We use the information we collect:</LegalP>
        <LegalUl>
          <LegalLi>To deliver and improve the Services and your overall user experience</LegalLi>
          <LegalLi>
            To protect, investigate, and deter against fraudulent, unauthorized,
            or illegal activity
          </LegalLi>
          <LegalLi>To link or combine user information with other Personal Information</LegalLi>
          <LegalLi>To develop, improve or expand our business, products and services</LegalLi>
          <LegalLi>
            To conduct internal reporting, auditing, and research, including focus
            groups and surveys
          </LegalLi>
          <LegalLi>
            To compare and verify information for accuracy and update our records
          </LegalLi>
          <LegalLi>
            To email, message, or otherwise contact you with information and
            updates about us and the Services
          </LegalLi>
          <LegalLi>To respond to your comments and questions and provide customer service</LegalLi>
          <LegalLi>
            To send you information including confirmations, invoices, technical
            notices, updates, security alerts, and support and administrative
            messages
          </LegalLi>
          <LegalLi>
            To analyze how you use the Services with analytics tools to help us
            understand traffic patterns and know if there are problems with the
            Services
          </LegalLi>
          <LegalLi>
            To combine information with other data we already have to improve
            your experience with our Services or inform you of products and
            services we think may be of interest to you
          </LegalLi>
          <LegalLi>In connection with a merger, acquisition, reorganization or similar transaction</LegalLi>
          <LegalLi>When required by law or to respond to legal process</LegalLi>
          <LegalLi>
            To protect our users, other individuals&apos; lives, and/or the rights
            or property of Landed
          </LegalLi>
          <LegalLi>To maintain the security of the Services</LegalLi>
          <LegalLi>
            At your direction or instruction, or for any other purpose with your
            consent
          </LegalLi>
          <LegalLi>
            To create aggregate and de-identified data. We will maintain such data
            in a de-identified form and will not attempt to re-identify any
            de-identified data, except that we may attempt to re-identify the
            data solely for the purpose of determining whether our deidentification
            processes are compliant with applicable laws
          </LegalLi>
        </LegalUl>
      </>
    ),
  },
  {
    id: "do-we-share-your-personal-information",
    title: "Do We Share Your Personal Information?",
    content: (
      <>
        <LegalP>
          In addition to the specific situations discussed elsewhere in this
          privacy policy, we disclose personal information in the following
          circumstances:
        </LegalP>
        <LegalUl>
          <LegalLi>With our corporate affiliates and subsidiaries</LegalLi>
          <LegalLi>
            With the applicable Customer to provide Services on their behalf. Our
            Customers are independent entities and their processing of information
            is subject to their own policies and terms
          </LegalLi>
          <LegalLi>
            With third parties that perform services to support our core business
            functions and internal operations, which may include database
            administrators, cloud computing services, hosting providers, payment
            processors, advertising service providers, support and customer
            service providers, security and fraud prevention service providers,
            analytics providers, and audio transcription providers
          </LegalLi>
          <LegalLi>To support our audit, compliance, and corporate governance functions</LegalLi>
          <LegalLi>
            In connection with a change of ownership or control of all or part of
            our business (such as a merger, acquisition, reorganization, or
            bankruptcy)
          </LegalLi>
          <LegalLi>
            If we have a good-faith belief that access, use, preservation, or
            disclosure of such information is reasonably necessary to detect,
            protect against or investigate fraud or security issues
          </LegalLi>
          <LegalLi>
            If required or permitted by applicable law or regulation, including to
            comply with a legal obligation or in response to a request from law
            enforcement or other public authorities
          </LegalLi>
          <LegalLi>With your consent or at your direction</LegalLi>
        </LegalUl>
        <LegalP>
          A current list of subprocessors is available on our{" "}
          <LegalLink href={LEGAL_ROUTES.subprocessors}>Subprocessors</LegalLink>{" "}
          page.
        </LegalP>
      </>
    ),
  },
  {
    id: "how-do-we-use-tracking-technologies",
    title: "How Do We Use Tracking Technologies?",
    content: (
      <>
        <LegalP>
          Some of the features on the Services may require the use of
          &ldquo;cookies&rdquo; — small text files that are stored on your
          device&apos;s hard drive. We use Cookies to enable our servers to
          recognize your web browser and tell us how and when you visit and use
          our Services, to remember your preferences, analyze trends, learn about
          our user base, provide relevant advertising, and operate and improve our
          Services.
        </LegalP>
        <LegalP>
          You may delete and block all cookies from our Services, but parts of the
          Services may not work or your overall user experience may be diminished,
          since it will no longer be personalized to you.
        </LegalP>
        <LegalTable
          headers={["Type of Cookies", "Description", "Managing Settings"]}
          rows={[
            [
              "Required cookies",
              "Required cookies enable you to navigate the Services and use their features, such as accessing secure areas of the Services and processing your online transactions and requests.",
              "Because required cookies are essential to operate the Services, there is no option to opt out of these cookies.",
            ],
            [
              "Performance cookies",
              "These cookies collect information about how you use our Services, including which pages you go to most often and if they receive error messages from certain pages. These cookies do not collect information that individually identify you.",
              "To learn how to opt out of performance cookies using your browser settings, visit aboutcookies.org.",
            ],
            [
              "Functionality cookies",
              "Functionality cookies allow our Services to remember information you have entered or choices you make and provide enhanced, more personal features.",
              "To learn how to opt out of functionality cookies using your browser settings, visit aboutcookies.org.",
            ],
            [
              "Marketing and advertising cookies",
              "Used to deliver targeted advertising, measure ad campaign effectiveness, and build audience profiles across platforms. These cookies may collect information about your browsing activity across different websites and services.",
              "You can manage your marketing cookie preferences through our cookie consent banner or browser settings.",
            ],
          ]}
        />
        <LegalP>
          For more detail, see our{" "}
          <LegalLink href={LEGAL_ROUTES.cookies}>Cookie Policy</LegalLink>.
        </LegalP>
      </>
    ),
  },
  {
    id: "how-do-we-secure-your-personal-information",
    title: "How Do We Secure Your Personal Information?",
    content: (
      <>
        <LegalP>
          We take reasonable steps to protect your Personal Information against
          unauthorized access, alteration, disclosure, misuse, or destruction.
        </LegalP>
        <LegalP>
          If you have an account with us, you are responsible for keeping your
          membership details confidential. Your account is protected by your
          account password and we urge you to take steps to keep your Personal
          Information safe by not disclosing your password and by logging out of
          your account after each use. We further protect your Personal
          Information from potential security breaches by implementing certain
          technological security measures including encryption, firewalls and
          secure socket layer technology. However, these measures do not
          guarantee that your Personal Information will not be accessed,
          disclosed, altered or destroyed by breach of such firewalls and secure
          server software. By using the Services, you acknowledge that you
          understand and agree to assume these risks.
        </LegalP>
      </>
    ),
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: (
      <>
        <LegalP>
          We retain your Personal Information while your account is in existence
          or as needed to provide the Services to you. This includes data you or
          others provided to us and data generated or inferred from your use of
          the Services.
        </LegalP>
        <LegalP>
          We may retain information that is otherwise deleted in de-identified and
          aggregated form, in archived or backup copies as required pursuant to
          records retention obligations, or otherwise as required by law. We may
          retain an archived copy of your records as required by law or for
          legitimate business purposes. We will also retain certain Technical
          Information for internal analysis purposes or to improve the
          functionality of our Services.
        </LegalP>
      </>
    ),
  },
  {
    id: "managing-your-privacy",
    title: "Managing Your Privacy",
    content: (
      <>
        <LegalP>
          All users may request to review, update, correct or delete the Personal
          Information furnished by a user in their user account by contacting us at{" "}
          {LEGAL.contact.privacy} or by accessing your user account.
        </LegalP>
        <LegalP>
          For your protection, we may only share and update the Personal
          Information associated with the specific email address that you use to
          send us your request, and we may need to verify your identity before
          doing so. We will try to comply with such requests in a reasonably
          timely manner.
        </LegalP>
        <LegalP>
          We may use some of the information we collect for marketing purposes,
          including to send you promotional communications about new Landed
          features, products, events, or other opportunities. If you wish to stop
          receiving these communications or to opt out of use of your information
          for these purposes, please follow the opt-out instructions, such as
          clicking &ldquo;Unsubscribe&rdquo; in those communications. You may
          also change your marketing email preferences via your account settings.
        </LegalP>
      </>
    ),
  },
  {
    id: "how-we-respond-to-do-not-track-signals",
    title: "How We Respond to Do Not Track Signals",
    content: (
      <>
        <LegalP>
          Your browser settings may allow you to automatically transmit a Do Not
          Track signal to websites and other online services you visit. We do not
          alter our practices when we receive a Do Not Track signal from a
          visitor&apos;s browser because we do not track our visitors to provide
          targeted advertising.
        </LegalP>
        <LegalP>
          To find out more about Do Not Track, please visit{" "}
          <LegalLink href="http://www.allaboutdnt.com">
            http://www.allaboutdnt.com
          </LegalLink>
          .
        </LegalP>
      </>
    ),
  },
  {
    id: "children-under-18",
    title: "Children Under 18",
    content: (
      <>
        <LegalP>
          The Services are intended for individuals who are at least eighteen
          (18) years of age. We do not solicit or knowingly collect Personal
          Information from anyone under eighteen (18).
        </LegalP>
        <LegalP>
          If you believe that we have unknowingly collected any Personal
          Information from someone under the age of eighteen (18), please contact
          us immediately at {LEGAL.contact.privacy} and the information will be
          deleted.
        </LegalP>
      </>
    ),
  },
  {
    id: "region-specific-disclosures",
    title: "Region-Specific Disclosures",
    content: (
      <>
        <LegalH3>A Note to California Residents</LegalH3>
        <LegalP>
          We currently do not share Personal Information with third parties for
          their direct marketing purposes, as contemplated by California Civil Code
          Section 1798.83, without your consent.
        </LegalP>

        <LegalH3>A Note to Nevada Residents</LegalH3>
        <LegalP>
          If you are a resident of Nevada, you have the right to opt-out of the
          sale of certain Personal Information to third parties who intend to
          license or sell that Personal Information. You can exercise this right
          by contacting us at {LEGAL.contact.privacy} with the subject line
          &ldquo;Nevada Do Not Sell Request&rdquo; and providing us with your name
          and the email address associated with your account. Please note that we
          do not currently sell your Personal Information as sales are defined in
          Nevada Revised Statutes Chapter 603A.
        </LegalP>

        <LegalH3>International Transfers</LegalH3>
        <LegalP>
          Landed is operated from the {LEGAL.jurisdiction.country}. Your Personal
          Information may be stored and processed in the UK, EEA, United States,
          or other countries where we or our subprocessors operate. Where we
          transfer Personal Information internationally, we use appropriate
          safeguards such as adequacy decisions or standard contractual clauses /
          the UK International Data Transfer Agreement, as described in our{" "}
          <a href={LEGAL_ROUTES.dpa} className="text-landed-600 underline">
            Data Processing Addendum
          </a>
          .
        </LegalP>

        <LegalH3>A Note to UK and European Residents</LegalH3>
        <LegalP>We typically will process your information pursuant to the following legal bases:</LegalP>
        <LegalOl>
          <LegalLi>With your consent</LegalLi>
          <LegalLi>As necessary to perform our agreement to provide Services to you</LegalLi>
          <LegalLi>As necessary for our legitimate interests</LegalLi>
        </LegalOl>
        <LegalP>
          We also may process your information where it is necessary to comply with
          a legal obligation to which we are subject.
        </LegalP>
        <LegalP>
          <LegalStrong>Your Rights.</LegalStrong> The laws of certain
          jurisdictions may provide data subjects with various rights in connection
          with the processing of Personal Information, including the right to
          withdraw consent, access, correct, erase, restrict processing, export
          data, object to processing, and lodge a complaint with a data protection
          authority. To exercise these rights, contact us at {LEGAL.contact.privacy}.
        </LegalP>
      </>
    ),
  },
  {
    id: "contact-us",
    title: "Contact Us",
    content: (
      <>
        <LegalP>
          If you have any questions about this Policy, your Personal Information,
          or the Services, you can contact us at {LEGAL.contact.privacy}.
        </LegalP>
        <LegalP>
          For general support, email {LEGAL.contact.support}. For legal notices,
          email {LEGAL.contact.legal}.
        </LegalP>
      </>
    ),
  },
];
