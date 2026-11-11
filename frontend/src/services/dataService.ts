import {
  LoanDataset,
  LoanApplication,
  Applicant,
  LoanProduct,
  Employment,
  IncomeRecord,
  CreditFacility,
  DocumentRecord,
  AffordabilityCheck,
  DecisionRecord,
  RepaymentSchedule,
  ApplicationEvent,
  GroundTruthEntry,
  ValidationReport,
  EnrichedApplication,
} from '@/types';

class DataService {
  private cache: LoanDataset | null = null;
  private currentScale: 'starter' | 'full' =
    typeof window !== 'undefined' && window.localStorage?.getItem('yottaflex_scale') === 'full'
      ? 'full'
      : 'starter';
  private loadingPromise: Promise<LoanDataset> | null = null;
  private fullScaleNotice: string | null = null;
  private noticeListeners: Array<(notice: string | null) => void> = [];

  public clearCache() {
    this.cache = null;
    this.loadingPromise = null;
  }

  public getScale(): 'starter' | 'full' {
    return this.currentScale;
  }

  public setScale(scale: 'starter' | 'full') {
    if (this.currentScale !== scale) {
      this.currentScale = scale;
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem('yottaflex_scale', scale);
      }
      this.cache = null;
      this.loadingPromise = null;
    }
  }

  public getFullScaleNotice(): string | null {
    return this.fullScaleNotice;
  }

  public setFullScaleNotice(notice: string | null) {
    this.fullScaleNotice = notice;
    this.notifyNoticeListeners();
  }

  public clearFullScaleNotice(): void {
    this.fullScaleNotice = null;
    this.notifyNoticeListeners();
  }

  public onNoticeChange(callback: (notice: string | null) => void): () => void {
    this.noticeListeners.push(callback);
    callback(this.fullScaleNotice);
    return () => {
      this.noticeListeners = this.noticeListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyNoticeListeners() {
    this.noticeListeners.forEach((cb) => {
      try {
        cb(this.fullScaleNotice);
      } catch (err) {
        console.error('Error notifying notice listener:', err);
      }
    });
  }

  /**
   * Checks whether the Full Scale data directory is accessible without firing multiple 404s.
   */
  public async isFullScaleAvailable(): Promise<boolean> {
    try {
      const res = await fetch('/data/full/loan_products.json', { method: 'HEAD' }).catch(() => null);
      if (res && (res.ok || res.status === 200 || res.status === 304)) {
        return true;
      }
      const getRes = await fetch('/data/full/loan_products.json').catch(() => null);
      return Boolean(getRes && (getRes.ok || getRes.status === 200 || getRes.status === 304));
    } catch {
      return false;
    }
  }

  /**
   * Loads all dataset tables in parallel with graceful Full Scale fallback.
   */
  public async loadDataset(): Promise<LoanDataset> {
    if (this.cache) {
      return this.cache;
    }
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      // If Full Scale is selected, probe first to ensure files exist on server.
      // If missing (e.g. deployed static host where 75MB data is excluded),
      // gracefully fall back to Starter Scale, update localStorage, and avoid repeated 404s.
      if (this.currentScale === 'full') {
        const available = await this.isFullScaleAvailable();
        if (!available) {
          console.warn(
            '[DataService] Full Scale dataset is not deployed on this instance. Falling back to Starter Scale.'
          );
          this.currentScale = 'starter';
          if (typeof window !== 'undefined') {
            window.localStorage?.setItem('yottaflex_scale', 'starter');
          }
          this.fullScaleNotice =
            'Full Scale dataset (~75 MB) is excluded from cloud deployment to optimize static delivery. Operating on Starter Scale (60 loans). To inspect Full Scale locally, run "python -m src.cli generate --scale full" and "npm run prepare-data".';
          this.notifyNoticeListeners();
        }
      }

      const basePath = `/data/${this.currentScale}`;

      const fetchJson = async <T>(file: string, fallback: T): Promise<T> => {
        try {
          const res = await fetch(`${basePath}/${file}`);
          if (!res.ok) {
            console.warn(`Failed to fetch ${file}: status ${res.status}`);
            return fallback;
          }
          return (await res.json()) as T;
        } catch (err) {
          console.error(`Error loading ${file}:`, err);
          return fallback;
        }
      };

      const [
        applicants,
        employments,
        income_records,
        credit_facilities,
        loan_products,
        loan_applications,
        documents,
        affordability_checks,
        decisions,
        repayment_schedules,
        application_events,
        ground_truth,
        validation_report,
      ] = await Promise.all([
        fetchJson<Applicant[]>('applicants.json', []),
        fetchJson<Employment[]>('employments.json', []),
        fetchJson<IncomeRecord[]>('income_records.json', []),
        fetchJson<CreditFacility[]>('credit_facilities.json', []),
        fetchJson<LoanProduct[]>('loan_products.json', []),
        fetchJson<LoanApplication[]>('loan_applications.json', []),
        fetchJson<DocumentRecord[]>('documents.json', []),
        fetchJson<AffordabilityCheck[]>('affordability_checks.json', []),
        fetchJson<DecisionRecord[]>('decisions.json', []),
        fetchJson<RepaymentSchedule[]>('repayment_schedules.json', []),
        fetchJson<ApplicationEvent[]>('application_events.json', []),
        fetchJson<GroundTruthEntry[]>('ground_truth.json', []),
        fetchJson<ValidationReport | undefined>('validation_report.json', undefined),
      ]);

      this.cache = {
        applicants,
        employments,
        income_records,
        credit_facilities,
        loan_products,
        loan_applications,
        documents,
        affordability_checks,
        decisions,
        repayment_schedules,
        application_events,
        ground_truth,
        validation_report,
      };

      return this.cache;
    })();

    return this.loadingPromise;
  }

  /**
   * Retrieves enriched application details with all relational joins.
   */
  public async getEnrichedApplication(applicationId: string): Promise<EnrichedApplication | null> {
    const dataset = await this.loadDataset();
    const app = dataset.loan_applications.find((a) => a.application_id === applicationId);
    if (!app) return null;

    const applicant = dataset.applicants.find((a) => a.applicant_id === app.applicant_id) || null;
    const product = dataset.loan_products.find((p) => p.product_id === app.product_id) || null;
    const employment = dataset.employments.find((e) => e.applicant_id === app.applicant_id && e.is_current) ||
      dataset.employments.find((e) => e.applicant_id === app.applicant_id) || null;
    const incomeRecords = dataset.income_records.filter((i) => i.applicant_id === app.applicant_id);
    const creditFacilities = dataset.credit_facilities.filter((c) => c.applicant_id === app.applicant_id);
    const documents = dataset.documents.filter((d) => d.application_id === app.application_id);
    const affordabilityCheck = dataset.affordability_checks.find((a) => a.application_id === app.application_id) || null;
    const decision = dataset.decisions.find((d) => d.application_id === app.application_id) || null;
    const repaymentSchedules = dataset.repayment_schedules
      .filter((s) => s.application_id === app.application_id)
      .sort((a, b) => a.installment_number - b.installment_number);
    const events = dataset.application_events
      .filter((e) => e.application_id === app.application_id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Ground truth is isolated and ONLY surfaced if explicitly matched in validation evaluation context
    const groundTruth = dataset.ground_truth.find((g) => g.application_id === app.application_id && g.is_anomaly) || null;

    return {
      application: app,
      applicant,
      product,
      employment,
      incomeRecords,
      creditFacilities,
      documents,
      affordabilityCheck,
      decision,
      repaymentSchedules,
      events,
      groundTruth,
    };
  }

  /**
   * Filters and sorts applications.
   */
  public async getApplications(params?: {
    search?: string;
    status?: string;
    decision?: string;
    productId?: string;
    sortBy?: keyof LoanApplication | 'dti' | 'decisionOutcome';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }) {
    const dataset = await this.loadDataset();
    let list = [...dataset.loan_applications];

    // Join decisions & affordability for search / sort if needed
    const decisionMap = new Map(dataset.decisions.map((d) => [d.application_id, d.outcome]));
    const dtiMap = new Map(dataset.affordability_checks.map((a) => [a.application_id, a.calculated_dti]));
    const applicantMap = new Map(dataset.applicants.map((a) => [a.applicant_id, `${a.first_name} ${a.last_name}`]));

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter((app) => {
        const applicantName = applicantMap.get(app.applicant_id)?.toLowerCase() || '';
        return (
          app.application_id.toLowerCase().includes(q) ||
          app.applicant_id.toLowerCase().includes(q) ||
          applicantName.includes(q)
        );
      });
    }

    if (params?.status && params.status !== 'ALL') {
      list = list.filter((app) => app.application_status === params.status);
    }

    if (params?.decision && params.decision !== 'ALL') {
      list = list.filter((app) => decisionMap.get(app.application_id) === params.decision);
    }

    if (params?.productId && params.productId !== 'ALL') {
      list = list.filter((app) => app.product_id === params.productId);
    }

    // Sorting
    const sortBy = params?.sortBy || 'submission_timestamp';
    const sortOrder = params?.sortOrder || 'desc';

    list.sort((a, b) => {
      let valA: any = a[sortBy as keyof LoanApplication];
      let valB: any = b[sortBy as keyof LoanApplication];

      if (sortBy === 'dti') {
        valA = dtiMap.get(a.application_id) ?? -1;
        valB = dtiMap.get(b.application_id) ?? -1;
      } else if (sortBy === 'decisionOutcome') {
        valA = decisionMap.get(a.application_id) ?? '';
        valB = decisionMap.get(b.application_id) ?? '';
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return sortOrder === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    });

    const total = list.length;
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const paginated = list.slice(start, start + pageSize);

    return {
      items: paginated.map((app) => ({
        ...app,
        decisionOutcome: decisionMap.get(app.application_id),
        calculatedDti: dtiMap.get(app.application_id),
        applicantName: applicantMap.get(app.applicant_id),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const dataService = new DataService();
