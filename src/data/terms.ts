import type { Lang } from './types'
import { CONTACT_EMAIL } from '../lib/site'

export interface TermsSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

/** ISO date of the last edit — shown on the page; bump it whenever the text changes. */
export const TERMS_UPDATED = '2026-10-04'

export const terms: Record<Lang, TermsSection[]> = {
  ka: [
    {
      id: 'general',
      title: 'ზოგადი დებულებები',
      paragraphs: [
        'ეს წესები არეგულირებს ვებგვერდ urigod.ge-ის (შემდგომში — „საიტი“) გამოყენებას. საიტზე შესვლით, მისი დათვალიერებით ან ანგარიშის შექმნით ადასტურებთ, რომ გაეცანით ამ წესებს და ეთანხმებით მათ.',
        'თუ რომელიმე პუნქტს არ ეთანხმებით, გთხოვთ, ნუ გამოიყენებთ საიტს.',
      ],
    },
    {
      id: 'service',
      title: 'რა არის urigod.ge',
      paragraphs: [
        'urigod.ge არის საინფორმაციო კატალოგი, რომელიც აერთიანებს ინფორმაციას რესტორნების, კაფეებისა და ბარების შესახებ: აღწერას, მისამართს, სამუშაო საათებს, ფილიალებსა და მენიუს.',
        'საიტი არ არის კვების ობიექტი და არ არის მხარე თქვენსა და ობიექტს შორის არსებულ ურთიერთობაში. ჩვენ არ ვიღებთ შეკვეთებს, ჯავშნებსა და გადახდებს და არ ვაგებთ პასუხს ობიექტის მიერ გაწეულ მომსახურებაზე.',
      ],
    },
    {
      id: 'accuracy',
      title: 'ინფორმაციის სიზუსტე',
      paragraphs: [
        'ვცდილობთ, საიტზე განთავსებული ინფორმაცია ზუსტი და განახლებული იყოს, თუმცა მას ხშირად თავად ობიექტები ავსებენ და ის ნებისმიერ დროს შეიძლება შეიცვალოს.',
      ],
      bullets: [
        'მენიუ, ფასები, სამუშაო საათები და მისამართები საინფორმაციო ხასიათისაა და შეიძლება განსხვავდებოდეს ადგილზე არსებულისგან. გადამწყვეტია ობიექტში მოქმედი ფასი და პირობები.',
        'ფოტოები საილუსტრაციოა და კერძი შეიძლება განსხვავებულად გამოიყურებოდეს.',
        'საიტი არ შეიცავს სრულ ინფორმაციას ალერგენებისა და შემადგენლობის შესახებ. თუ გაქვთ ალერგია ან კვებითი შეზღუდვა, აუცილებლად დააზუსტეთ ობიექტში.',
        'ფასის დონე (₾ / ₾₾ / ₾₾₾) მიახლოებითი შეფასებაა და არა ოფიციალური კლასიფიკაცია.',
      ],
    },
    {
      id: 'ai',
      title: 'AI ასისტენტი',
      paragraphs: [
        'საიტზე მოქმედებს ხელოვნურ ინტელექტზე დაფუძნებული ასისტენტი, რომელიც ადგილის შერჩევაში გეხმარებათ. მისი პასუხები ავტომატურად გენერირდება და შეიძლება არაზუსტი ან არასრული იყოს.',
      ],
      bullets: [
        'ასისტენტის პასუხი რეკომენდაციაა და არა გარანტია. ფასები და საათები გადაამოწმეთ ობიექტის გვერდზე ან თავად ობიექტში.',
        'ნუ შეიყვანთ ჩატში პერსონალურ, ფინანსურ ან სხვა სენსიტიურ ინფორმაციას.',
        'თქვენი შეტყობინებები პასუხის მოსამზადებლად გადაეცემა მესამე მხარის სერვისს (Google Gemini).',
        'ფასის დონესაც AI ადგენს მენიუს ფასების მიხედვით, ამიტომ ისიც მიახლოებითია.',
      ],
    },
    {
      id: 'account',
      title: 'მომხმარებლის ანგარიში',
      paragraphs: [
        'საიტის დათვალიერება რეგისტრაციის გარეშეა შესაძლებელი. ანგარიში საჭიროა რჩეული ადგილების შესანახად და ობიექტის სამართავად.',
      ],
      bullets: [
        'რეგისტრაციისას მიუთითეთ სწორი მონაცემები და არ გამოიყენოთ სხვისი სახელი ან ელფოსტა.',
        'პაროლის უსაფრთხოებაზე პასუხისმგებელი თქვენ ხართ. ანგარიშიდან შესრულებული ქმედებები თქვენს ქმედებად ითვლება.',
        'წესების დარღვევის შემთხვევაში შეგვიძლია ანგარიში შევზღუდოთ ან წავშალოთ.',
        'ანგარიშის წაშლა ნებისმიერ დროს შეგიძლიათ მოითხოვოთ ქვემოთ მითითებულ ელფოსტაზე.',
      ],
    },
    {
      id: 'venues',
      title: 'ობიექტების მფლობელები და მენეჯერები',
      paragraphs: ['თუ საიტზე მართავთ რესტორნის, კაფის ან ბარის გვერდს, ვრცელდება დამატებითი პირობები:'],
      bullets: [
        'თქვენ აგებთ პასუხს განთავსებული ინფორმაციის, ფასებისა და ფოტოების სისწორესა და კანონიერებაზე.',
        'ადასტურებთ, რომ გაქვთ ატვირთული ტექსტების, ლოგოსა და ფოტოების გამოყენების უფლება.',
        'გვაძლევთ უფლებას, ეს მასალა ვაჩვენოთ საიტზე, საძიებო სისტემებსა და სოციალურ ქსელებში ობიექტის წარსადგენად.',
        'შეგვიძლია შევასწოროთ, დავმალოთ ან წავშალოთ ინფორმაცია, რომელიც მცდარია, შეურაცხმყოფელია ან არღვევს კანონს ან სხვის უფლებებს.',
      ],
    },
    {
      id: 'prohibited',
      title: 'აკრძალული ქმედებები',
      paragraphs: ['საიტის გამოყენებისას აკრძალულია:'],
      bullets: [
        'მონაცემების ავტომატური მასობრივი შეგროვება (scraping) ჩვენი წერილობითი თანხმობის გარეშე;',
        'საიტის მუშაობის შეფერხება, უსაფრთხოების გვერდის ავლა ან სხვის ანგარიშზე უნებართვო წვდომა;',
        'ცრუ, შეცდომაში შემყვანი ან სხვისი უფლებების დამრღვევი ინფორმაციის განთავსება;',
        'AI ასისტენტის გამოყენება საიტის დანიშნულებასთან შეუსაბამო მიზნებით ან მისი გადატვირთვა.',
      ],
    },
    {
      id: 'ip',
      title: 'ინტელექტუალური საკუთრება',
      paragraphs: [
        'საიტის დიზაინი, ლოგო, სახელწოდება, ტექსტები და პროგრამული კოდი ეკუთვნის urigod.ge-ს და დაცულია კანონით. მათი გამოყენება ჩვენი თანხმობის გარეშე დაუშვებელია.',
        'ობიექტების სახელწოდებები, ლოგოები და ფოტოები ეკუთვნის შესაბამის მფლობელებს.',
      ],
    },
    {
      id: 'third-party',
      title: 'მესამე მხარის სერვისები და ბმულები',
      paragraphs: [
        'საიტი იყენებს მესამე მხარის სერვისებს (მაგალითად, OpenStreetMap-ის რუკას და Google Maps-ის მარშრუტს) და შეიცავს ბმულებს ობიექტების ვებგვერდებსა და სოციალურ ქსელებზე. მათ შინაარსსა და მუშაობაზე პასუხს არ ვაგებთ; მათზე ვრცელდება შესაბამისი სერვისის პირობები.',
      ],
    },
    {
      id: 'privacy',
      title: 'პერსონალური მონაცემები',
      paragraphs: ['ვამუშავებთ მხოლოდ იმ მონაცემებს, რომლებიც საიტის მუშაობისთვისაა საჭირო:'],
      bullets: [
        'ანგარიშის მონაცემები: სახელი, ელფოსტა და, თუ მიუთითებთ, ტელეფონის ნომერი;',
        'თქვენი რჩეული ადგილების სია;',
        'აქტივობის ჩანაწერები (მაგალითად, შესვლა და ობიექტის მონაცემების ცვლილება) უსაფრთხოებისა და კონტროლის მიზნით;',
        'ბრაუზერში ინახება ენის არჩევანი და AI ასისტენტთან მიმდინარე საუბარი; საიტის გასაუმჯობესებლად ვიყენებთ ანონიმურ სტატისტიკას.',
        'მონაცემებს ჩვენი დავალებით ამუშავებენ ტექნიკური პარტნიორები: Google Firebase (ავტორიზაცია, მონაცემთა ბაზა, სტატისტიკა), Vercel (ჰოსტინგი), Cloudinary (ფოტოები) და Google Gemini (AI ასისტენტი).',
        'თქვენს მონაცემებს არ ვყიდით და სარეკლამო მიზნით მესამე პირებს არ გადავცემთ.',
        'გაქვთ უფლება, მოითხოვოთ თქვენი მონაცემების ნახვა, გასწორება ან წაშლა — მოგვწერეთ ქვემოთ მითითებულ ელფოსტაზე.',
      ],
    },
    {
      id: 'liability',
      title: 'პასუხისმგებლობის შეზღუდვა',
      paragraphs: [
        'საიტი მოგეწოდებათ არსებული სახით („როგორც არის“). კანონით დაშვებულ ფარგლებში არ ვაგებთ პასუხს:',
      ],
      bullets: [
        'ობიექტის მომსახურების ხარისხზე, კერძების უვნებლობასა და ობიექტის ნებისმიერ ქმედებაზე;',
        'საიტზე მითითებულ და ობიექტში არსებულ ფასებს, მენიუს ან სამუშაო საათებს შორის სხვაობაზე;',
        'AI ასისტენტის პასუხებზე დაყრდნობით მიღებულ გადაწყვეტილებებზე;',
        'საიტის დროებით მიუწვდომლობაზე ან ტექნიკურ ხარვეზებზე.',
      ],
    },
    {
      id: 'changes',
      title: 'წესების ცვლილება',
      paragraphs: [
        'წესები შეიძლება დროდადრო განახლდეს. მოქმედი ვერსია ყოველთვის ამ გვერდზეა, ბოლო განახლების თარიღით. ცვლილების შემდეგ საიტის გამოყენების გაგრძელება ნიშნავს, რომ ეთანხმებით ახალ რედაქციას.',
      ],
    },
    {
      id: 'law',
      title: 'მოქმედი სამართალი',
      paragraphs: [
        'წესებზე ვრცელდება საქართველოს კანონმდებლობა. დავა წყდება მოლაპარაკებით, ხოლო შეუთანხმებლობის შემთხვევაში — საქართველოს სასამართლოს მიერ.',
      ],
    },
    {
      id: 'contact',
      title: 'კონტაქტი',
      paragraphs: [`კითხვების, შენიშვნების ან ინფორმაციის გასწორების მოთხოვნის შემთხვევაში მოგვწერეთ: ${CONTACT_EMAIL}`],
    },
  ],
  en: [
    {
      id: 'general',
      title: 'General',
      paragraphs: [
        'These terms govern the use of the website urigod.ge (the “Site”). By visiting or browsing the Site or creating an account you confirm that you have read these terms and agree to them.',
        'If you do not agree with any of them, please do not use the Site.',
      ],
    },
    {
      id: 'service',
      title: 'What urigod.ge is',
      paragraphs: [
        'urigod.ge is an information directory of restaurants, cafés and bars: descriptions, addresses, opening hours, branches and menus.',
        'The Site is not a food business and is not a party to any relationship between you and a venue. We do not take orders, bookings or payments and are not responsible for the service a venue provides.',
      ],
    },
    {
      id: 'accuracy',
      title: 'Accuracy of information',
      paragraphs: ['We try to keep the information accurate and up to date, but it is often entered by the venues themselves and may change at any time.'],
      bullets: [
        'Menus, prices, opening hours and addresses are for information only and may differ from what you find on site. The price and conditions at the venue prevail.',
        'Photos are illustrative; a dish may look different.',
        'The Site does not contain complete information about allergens and ingredients. If you have an allergy or a dietary restriction, always check with the venue.',
        'The price level (₾ / ₾₾ / ₾₾₾) is an approximate estimate, not an official classification.',
      ],
    },
    {
      id: 'ai',
      title: 'AI assistant',
      paragraphs: ['The Site offers an assistant based on artificial intelligence that helps you choose a place. Its answers are generated automatically and may be inaccurate or incomplete.'],
      bullets: [
        'An answer from the assistant is a suggestion, not a guarantee. Check prices and hours on the venue page or with the venue.',
        'Do not enter personal, financial or other sensitive information into the chat.',
        'Your messages are passed to a third-party service (Google Gemini) to prepare a reply.',
        'The price level is also derived by AI from menu prices, so it is approximate too.',
      ],
    },
    {
      id: 'account',
      title: 'User accounts',
      paragraphs: ['You can browse the Site without registering. An account is needed to save favourite places and to manage a venue.'],
      bullets: [
        'Provide correct details when registering and do not use someone else’s name or email.',
        'You are responsible for keeping your password safe. Actions taken from your account are treated as yours.',
        'We may restrict or delete an account that breaks these terms.',
        'You can ask us to delete your account at any time using the email below.',
      ],
    },
    {
      id: 'venues',
      title: 'Venue owners and managers',
      paragraphs: ['If you manage a restaurant, café or bar page on the Site, these additional terms apply:'],
      bullets: [
        'You are responsible for the accuracy and legality of the information, prices and photos you publish.',
        'You confirm that you have the right to use the texts, logo and photos you upload.',
        'You allow us to display this material on the Site, in search engines and on social networks to present the venue.',
        'We may correct, hide or remove information that is wrong, offensive, unlawful or infringes someone’s rights.',
      ],
    },
    {
      id: 'prohibited',
      title: 'Prohibited use',
      paragraphs: ['When using the Site you must not:'],
      bullets: [
        'collect data automatically in bulk (scraping) without our written consent;',
        'disrupt the Site, bypass its security or access someone else’s account without permission;',
        'publish false, misleading or infringing information;',
        'use the AI assistant for purposes unrelated to the Site or overload it.',
      ],
    },
    {
      id: 'ip',
      title: 'Intellectual property',
      paragraphs: [
        'The design, logo, name, texts and code of the Site belong to urigod.ge and are protected by law. They may not be used without our consent.',
        'Venue names, logos and photos belong to their respective owners.',
      ],
    },
    {
      id: 'third-party',
      title: 'Third-party services and links',
      paragraphs: [
        'The Site uses third-party services (for example the OpenStreetMap map and Google Maps directions) and links to venues’ websites and social networks. We are not responsible for their content or operation; their own terms apply.',
      ],
    },
    {
      id: 'privacy',
      title: 'Personal data',
      paragraphs: ['We process only the data needed to run the Site:'],
      bullets: [
        'account details: name, email and, if you provide it, phone number;',
        'your list of favourite places;',
        'activity records (such as sign-ins and changes to venue data) for security and oversight;',
        'your browser stores the language choice and the current AI conversation; we use anonymous statistics to improve the Site.',
        'Data is processed on our behalf by technical providers: Google Firebase (authentication, database, statistics), Vercel (hosting), Cloudinary (photos) and Google Gemini (AI assistant).',
        'We do not sell your data or pass it to third parties for advertising.',
        'You may ask to see, correct or delete your data — write to the email below.',
      ],
    },
    {
      id: 'liability',
      title: 'Limitation of liability',
      paragraphs: ['The Site is provided “as is”. To the extent permitted by law we are not liable for:'],
      bullets: [
        'the quality of a venue’s service, the safety of its food or any of its actions;',
        'differences between the prices, menu or opening hours shown on the Site and those at the venue;',
        'decisions made on the basis of the AI assistant’s answers;',
        'temporary unavailability of the Site or technical faults.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to these terms',
      paragraphs: ['These terms may be updated from time to time. The current version is always on this page with the date of the last update. Continuing to use the Site after a change means you accept the new version.'],
    },
    {
      id: 'law',
      title: 'Governing law',
      paragraphs: ['These terms are governed by the law of Georgia. Disputes are settled by negotiation and, failing that, by the courts of Georgia.'],
    },
    {
      id: 'contact',
      title: 'Contact',
      paragraphs: [`For questions, comments or requests to correct information, write to: ${CONTACT_EMAIL}`],
    },
  ],
}
