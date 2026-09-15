type Dictionary = {
  common: { brand: string };
  navigation: {
    homeAriaLabel: string;
    products: string;
    browse: string;
    demoLab: string;
    howBuyingWorks: string;
    statusCatalogDev: string;
    backToCatalog: string;
    languageGroupLabel: string;
    switchToEnglish: string;
    switchToThai: string;
    currentLanguageEnglish: string;
    currentLanguageThai: string;
  };
  home: {
    kicker: string;
    heading: string;
    lede: string;
    browseProducts: string;
    tryDemoLab: string;
    heroIndex: readonly { value: string; label: string }[];
    workbookAriaLabel: string;
    workbookBarTitle: string;
    workbookBarPreview: string;
    sheet1Label: string;
    cashPosition: string;
    syntheticBadge: string;
    sheetRows: {
      category: string; typical: string; tight: string; monthlyIncome: string;
      essentialExpenses: string; flexibleExpenses: string; totalCommitments: string;
      remainingCash: string; savingsRate: string;
    };
    sheetTabs: { cashPosition: string; breakdown: string; notes: string };
  };
  catalog: {
    kicker: string;
    heading: string;
    lede: string;
    productCard: {
      featuredPreview: string; statusTag: string; facts: readonly string[]; launchPrice: string;
      openDemo: string; viewProduct: string; previewAriaLabel: string; sheet2Label: string;
      income: string; commitments: string; remaining: string; savingsRate: string; gapToTarget: string;
    };
    pipeline: {
      next: { rail: string; meta: string; status: string; title: string; body: string; family: string };
      future: { rail: string; meta: string; status: string; title: string; body: string; family: string };
    };
    browse: {
      heading: string;
      lede: string;
      chips: { allProducts: string; planning: string; analysis: string; withLiveDemo: string };
      useCases: { normalMonth: string; tightMonth: string; dayRate: string; oneTool: string; later: string };
      ariaLabel: string;
    };
  };
  demo: {
    kicker: string;
    heading: string;
    lede: string;
    tabs: { cashflowPlanner: string; moreDemos: string };
    showcase: {
      interactiveShowcase: string;
      resetFixture: string;
      reset: string;
      panelInput: string;
      panelCalculation: string;
      panelResult: string;
      resultIntro: string;
      targetGap: string;
      barIncome: string;
      barCommitted: string;
      barRemaining: string;
      totalCommitments: string;
      savingsRate: string;
      tightMonth: string;
      openFullProduct: string;
      /** Template strings interpolated client-side; placeholders in {curly} braces. */
      resultCoveredTemplate: string;
      resultShortTemplate: string;
      rangeErrorTemplate: string;
      freelancerCashflow: {
        title: string;
        disclosure: string;
        inputs: {
          monthlyIncome: string; essentialExpenses: string; flexibleExpenses: string;
          monthlyCommitments: string; savingsTarget: string;
        };
        outputs: { remaining: string; commitments: string; savingsRate: string; targetGap: string };
        views: { cashflow: string; breakdown: string };
        scenarios: { typical: string; tight: string };
        introText: string;
        tableColumns: { category: string; thb: string };
        chartLabel: string;
        rows: { income: string; commitments: string; remaining: string };
      };
    };
  };
  product: {
    eyebrowSyntheticFixture: string;
    developmentFixture: string;
    fixtureDisclosureAriaLabel: string;
    benefitsHeading: string;
    illustrativePrice: string;
    saleAvailabilityUnavailable: string;
    purchaseUnavailable: string;
    compatibilityHeading: string;
    licenseHeading: string;
    availabilityAriaLabel: string;
    freelancerCashflowPlanner: {
      title: string;
      summary: string;
      benefits: readonly string[];
      compatibility: readonly string[];
      licenseSummary: string;
      fixtureDisclosure: string;
      demoDisclosure: string;
    };
  };
  purchase: {
    kicker: string;
    heading: string;
    lede: string;
    steps: readonly { title: string; body: string }[];
  };
  footer: {
    statementLines: readonly string[];
    browseHeading: string;
    products: string;
    families: string;
    useCases: string;
    platformHeading: string;
    demoLab: string;
    howBuyingWorks: string;
    productDetails: string;
    statusHeading: string;
    statusPreview: string;
    statusNotForSale: string;
    statusSyntheticDemo: string;
  };
  metadata: { title: string; description: string };
};

export const en: Dictionary = {
  common: {
    brand: "BRexcel",
  },
  navigation: {
    homeAriaLabel: "BRexcel home",
    products: "Products",
    browse: "Browse",
    demoLab: "Demo Lab",
    howBuyingWorks: "How buying works",
    statusCatalogDev: "Catalog in development",
    backToCatalog: "Catalog preview",
    languageGroupLabel: "Language",
    switchToEnglish: "Switch to English",
    switchToThai: "Switch to Thai",
    currentLanguageEnglish: "English (current)",
    currentLanguageThai: "Thai (current)",
  },
  home: {
    kicker: "BRexcel — spreadsheet-native tools",
    heading: "Focused Excel tools, built one module at a time.",
    lede: "BRexcel is a growing collection of focused spreadsheet tools. Each module is designed for one clear job, with a public browser demo wherever a product is ready to show.",
    browseProducts: "Browse products",
    tryDemoLab: "Try the Demo Lab",
    heroIndex: [
      { value: "01", label: "Public product preview" },
      { value: "01", label: "Interactive demo" },
      { value: "DEV", label: "Storefront status" },
    ],
    workbookAriaLabel: "Synthetic cashflow workbook preview",
    workbookBarTitle: "Cashflow · 01",
    workbookBarPreview: "Preview data",
    sheet1Label: "SHEET 1",
    cashPosition: "Cash position",
    syntheticBadge: "Synthetic",
    sheetRows: {
      category: "Category",
      typical: "Typical",
      tight: "Tight",
      monthlyIncome: "Monthly income",
      essentialExpenses: "Essential expenses",
      flexibleExpenses: "Flexible expenses",
      totalCommitments: "Total commitments",
      remainingCash: "Remaining cash",
      savingsRate: "Savings rate",
    },
    sheetTabs: {
      cashPosition: "Cash position",
      breakdown: "Breakdown",
      notes: "Notes",
    },
  },
  catalog: {
    kicker: "Products",
    heading: "A catalog built to grow.",
    lede: "BRexcel green stays constant. Each released product adds one useful accent.",
    productCard: {
      featuredPreview: "Featured product preview",
      statusTag: "Synthetic fixture · not for sale",
      facts: ["Excel concept", "Live browser demo", "Two scenarios"],
      launchPrice: "Price announced at launch",
      openDemo: "Open demo",
      viewProduct: "View product",
      previewAriaLabel: "Cashflow breakdown preview",
      sheet2Label: "SHEET 2 · BREAKDOWN",
      income: "Income",
      commitments: "Commitments",
      remaining: "Remaining",
      savingsRate: "Savings rate",
      gapToTarget: "Gap to target",
    },
    pipeline: {
      next: {
        rail: "PLANNING · 02",
        meta: "Next module",
        status: "In development",
        title: "Next workbook module",
        body: "Being written and tested. Its name, demo and price will appear only when they are ready.",
        family: "Planning family",
      },
      future: {
        rail: "ANALYSIS · —",
        meta: "Future module",
        status: "Coming later",
        title: "Analysis module",
        body: "No feature claims yet. This space is reserved for a future tool once its scope is public.",
        family: "Analysis family",
      },
    },
    browse: {
      heading: "Browse",
      lede: "Browse by family, or start from the job",
      chips: {
        allProducts: "All products",
        planning: "Planning",
        analysis: "Analysis",
        withLiveDemo: "With a live demo",
      },
      useCases: {
        normalMonth: "What does a normal month leave me?",
        tightMonth: "How different is a tight month?",
        dayRate: "What should I charge per day?",
        oneTool: "1 tool",
        later: "Later",
      },
      ariaLabel: "Catalog families",
    },
  },
  demo: {
    kicker: "Demo Lab · a BRexcel platform feature",
    heading: "Try how a tool thinks before you buy it.",
    lede: "This public preview uses synthetic figures and validated arithmetic written for the web. It never loads or exposes a proprietary workbook in the browser.",
    tabs: {
      cashflowPlanner: "Cashflow Planner",
      moreDemos: "More demos as products ship",
    },
    showcase: {
      interactiveShowcase: "Interactive product showcase",
      resetFixture: "Reset fixture",
      reset: "Reset",
      panelInput: "01 · Input · THB / month",
      panelCalculation: "02 · Calculation",
      panelResult: "03 · Result",
      resultIntro: "This month leaves",
      targetGap: "Target gap",
      barIncome: "Income",
      barCommitted: "Committed",
      barRemaining: "Remaining",
      totalCommitments: "Total commitments",
      savingsRate: "Savings rate",
      tightMonth: "Tight month",
      openFullProduct: "Open full product",
      resultCoveredTemplate: "A {rate}% savings rate — the {target} target is covered.",
      resultShortTemplate: "A {rate}% savings rate — {gap} THB short of the target.",
      rangeErrorTemplate: "{label} must be between {min} and {max}.",
      freelancerCashflow: {
        title: "Freelancer Cashflow Planner preview",
        disclosure: "Interactive web representation with hand-authored synthetic arithmetic. It is not the downloadable workbook.",
        inputs: {
          monthlyIncome: "Monthly income",
          essentialExpenses: "Essential expenses",
          flexibleExpenses: "Flexible expenses",
          monthlyCommitments: "Debt / commitments",
          savingsTarget: "Savings target",
        },
        outputs: {
          remaining: "Remaining cash",
          commitments: "Total monthly commitments",
          savingsRate: "Savings rate (%)",
          targetGap: "Gap to savings target",
        },
        views: {
          cashflow: "Cash position",
          breakdown: "Breakdown",
        },
        scenarios: {
          typical: "Typical month",
          tight: "Tight month",
        },
        introText: "Adjust a representative month to see what remains after commitments.",
        tableColumns: {
          category: "Category",
          thb: "THB",
        },
        chartLabel: "Monthly cashflow breakdown",
        rows: {
          income: "Income",
          commitments: "Commitments",
          remaining: "Remaining",
        },
      },
    },
  },
  product: {
    eyebrowSyntheticFixture: "Synthetic fixture",
    developmentFixture: "Development fixture",
    fixtureDisclosureAriaLabel: "Fixture disclosure",
    benefitsHeading: "What it would help with",
    illustrativePrice: "Illustrative price",
    saleAvailabilityUnavailable: "Sale availability: not available.",
    purchaseUnavailable: "Purchasing is not available in this development slice.",
    compatibilityHeading: "Compatibility",
    licenseHeading: "Licensing status",
    availabilityAriaLabel: "Product availability",
    freelancerCashflowPlanner: {
      title: "Freelancer Cashflow Planner",
      summary: "A synthetic spreadsheet concept for planning freelance income, essential costs, and monthly cashflow.",
      benefits: [
        "See a simple monthly view of expected income and essential outgoings.",
        "Spot months where planned spending may exceed expected freelance income.",
        "Use one place to prepare a basic cashflow conversation with yourself or an adviser.",
      ],
      compatibility: [
        "Illustrative compatibility: Microsoft Excel for Microsoft 365 or Excel 2021 and later.",
        "This synthetic fixture has not been validated against a real workbook or any spreadsheet application.",
      ],
      licenseSummary: "License terms are a placeholder for this synthetic fixture; they are not approved commercial terms.",
      fixtureDisclosure: "Synthetic product fixture — not a real BRexcel commercial offering.",
      demoDisclosure: "Interactive demo coming in a later development slice.",
    },
  },
  purchase: {
    kicker: "Release path",
    heading: "How buying will work",
    lede: "Public purchasing is not open in this development slice. When a product is released, BRexcel is designed around a short guest checkout with server-confirmed payment.",
    steps: [
      { title: "Try the public demo", body: "synthetic data, nothing to install." },
      { title: "Wait for a public release", body: "price and availability appear only after validation." },
      { title: "Payment is confirmed server-side", body: "before any future fulfilment action." },
    ],
  },
  footer: {
    statementLines: ["Spreadsheet-native tools", "built one module at a time."],
    browseHeading: "Browse",
    products: "Products",
    families: "Families",
    useCases: "Use cases",
    platformHeading: "Platform",
    demoLab: "Demo Lab",
    howBuyingWorks: "How buying works",
    productDetails: "Product details",
    statusHeading: "Status",
    statusPreview: "Public storefront preview",
    statusNotForSale: "Product not for sale",
    statusSyntheticDemo: "Demo uses synthetic data",
  },
  metadata: {
    title: "BRexcel — Spreadsheet-native tools",
    description: "Focused Excel tools, built one module at a time — with public browser demos that use synthetic data.",
  },
};

export type Messages = Dictionary;
