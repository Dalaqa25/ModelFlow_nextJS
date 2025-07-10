
const PLANS = {
  basic: {
    name: "Basic",
    price: 0,
    features: {
      activeStorage: "250 MB",
      archiveStorage: "100 MB",
      maxModels: 4,
      maxFileSize: "50 MB",
      buyersPerModel: 10,
      modelDownloadLimit: "100/month",
      privateModelAccess: false,
      downloadAnalytics: false,
      priorityEmailSupport: false,
      earlyAccess: false,
    }
  },
  professional: {
    name: "Professional",
    price: 14.5,
    features: {
      activeStorage: "1 GB",
      archiveStorage: "500 MB",
      maxModels: 12,
      maxFileSize: "100 MB",
      buyersPerModel: 50,
      modelDownloadLimit: "1000/month",
      privateModelAccess: true,
      downloadAnalytics: true,
      priorityEmailSupport: true,
      earlyAccess: false,
    }
  },
  enterprise: {
    name: "Enterprise",
    price: 24.5,
    features: {
      activeStorage: "2 GB",
      archiveStorage: "1 GB",
      maxModels: "Unlimited",
      maxFileSize: "150 MB",
      buyersPerModel: "Unlimited",
      modelDownloadLimit: "Unlimited",
      privateModelAccess: true,
      downloadAnalytics: true,
      priorityEmailSupport: true,
      earlyAccess: true,
    }
  }
};

export default PLANS;
