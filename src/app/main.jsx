const NTG = window.NTG = window.NTG || {};
NTG.app = NTG.app || {};

const { useState, useEffect, useMemo } = React;
const shipmentData = NTG.domain.shipments.data;
const shipmentService = NTG.domain.shipments.service;
const { useTheme, syncThemeDocument } = NTG.app.theme;
const { fmtDate, fmtTime } = NTG.shared.utils.formatters;
const {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakToggle,
  TweakRadio,
  TweakButton,
} = NTG.shared.ui;
const { Brand, MiniStat, AudienceSwitch } = NTG.app.shellUi;
const { Overview } = NTG.features.dashboard;
const { ShipmentList, ShipmentDetail, ExceptionQueue, Analytics } = NTG.features.shipments;

const FALLBACK_TWEAK_DEFAULTS = {
  dark: true,
  mapVariant: "geographic",
  audienceMode: "internal",
  density: "regular",
  showTier1: true,
  showTier2: true,
  showTier3: true,
  showTier4: false,
};

function App() {
  const [tweaks, setTweak] = useTweaks(NTG.app.tweakDefaults || FALLBACK_TWEAK_DEFAULTS);
  const theme = useTheme(tweaks.dark);
  const [view, setView] = useState("overview");
  const [shipments, setShipments] = useState(() => shipmentService.createInitialShipments());
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(shipmentData.NOW_REF);
  const [recentEvent, setRecentEvent] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [dataSource, setDataSource] = useState("checking");
  const customerPortalName = shipmentService.getCustomerPortalName(shipmentData.SHIPMENTS);
  const isCustomerView = tweaks.audienceMode === "customer";

  const layout = useMemo(() => ({
    isTablet: viewportWidth < 1220,
    isMobile: viewportWidth < 940,
    isNarrow: viewportWidth < 700,
  }), [viewportWidth]);

  const visibleTiers = {
    1: tweaks.showTier1,
    2: tweaks.showTier2,
    3: tweaks.showTier3,
    4: tweaks.showTier4,
  };

  const displayedShipments = useMemo(() => (
    shipmentService.getDisplayedShipments(shipments, tweaks.audienceMode, customerPortalName)
  ), [shipments, tweaks.audienceMode, customerPortalName]);

  const stats = useMemo(() => shipmentService.buildShipmentStats(displayedShipments), [displayedShipments]);

  useEffect(() => {
    syncThemeDocument(theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    shipmentService.loadBootstrapData().then((result) => {
      if (!active) return;
      setShipments(shipmentService.createInitialShipments());
      setNow(shipmentData.NOW_REF);
      setSelected(null);
      setRecentEvent(null);
      setDataSource(result.source);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isCustomerView && (view === "exceptions" || view === "analytics")) {
      setView("overview");
    }
  }, [isCustomerView, view]);

  useEffect(() => {
    if (selected && !displayedShipments.some((shipment) => shipment.id === selected.id)) {
      setSelected(null);
    }
  }, [displayedShipments, selected]);

  useEffect(() => {
    const id = setInterval(() => setNow((value) => value + 60_000), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!recentEvent) return undefined;
    const id = setTimeout(() => setRecentEvent(null), 4500);
    return () => clearTimeout(id);
  }, [recentEvent]);

  const simulateEvent = async () => {
    const result = await shipmentService.simulateNextShipmentEventRemote({
      shipments,
      visibleShipments: displayedShipments,
      now,
    });
    if (!result) return;

    setShipments(result.shipments);
    setRecentEvent(result.recentEvent);
    setNow(result.now);
    setDataSource(result.source);
  };

  const resetShipments = async () => {
    const result = await shipmentService.resetBootstrapData();
    setShipments(result.shipments);
    setSelected(null);
    setRecentEvent(null);
    setNow(result.now);
    setDataSource(result.source);
  };

  const navItems = [
    { id: "overview", label: "Overview", badge: null },
    { id: "shipments", label: "Shipments", badge: displayedShipments.length },
    ...(!isCustomerView ? [
      { id: "exceptions", label: "Exceptions", badge: stats.atRisk + stats.exception, badgeTone: "warning" },
      { id: "analytics", label: "Analytics", badge: null },
    ] : []),
  ];

  return (
    <div className="ntg-app-shell">
      <div className="ntg-app-glow" />

      <div className="ntg-app-frame">
        <div className="ntg-app-grid">
          <aside className="ntg-panel ntg-sidebar">
            <Brand />

            <div className="ntg-panel ntg-sidebar-hero">
              <div className="ntg-sidebar-hero-orb" />
              <div className="ntg-sidebar-hero-copy">
                <div className="ntg-audience-section-title">Control tower</div>
                <div className="ntg-sidebar-hero-title">Denmark freight visibility</div>
                <p className="ntg-sidebar-hero-text">
                  A calmer, more premium dashboard for checkpoint-confirmed shipment progress.
                </p>
              </div>
            </div>

            <div>
              <div className="ntg-audience-section-title">Audience mode</div>
              <AudienceSwitch value={tweaks.audienceMode} onChange={(mode) => setTweak("audienceMode", mode)} />
              {isCustomerView && (
                <div className="ntg-customer-pill">Portal account: {customerPortalName}</div>
              )}
            </div>

            <nav className="ntg-nav">
              {navItems.map((item) => {
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`ntg-nav-button${active ? " is-active" : ""}`}
                  >
                    <span>
                      <span className="ntg-nav-title">{item.label}</span>
                      <span className="ntg-nav-subtitle">
                        {item.id === "overview" && "Executive summary"}
                        {item.id === "shipments" && "Live tracking list"}
                        {item.id === "exceptions" && "Flagged operational cases"}
                        {item.id === "analytics" && "Network performance"}
                      </span>
                    </span>
                    {item.badge != null && (
                      <span className="ntg-nav-badge" data-tone={item.badgeTone || "default"}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="ntg-sidebar-footer">
              <div className="ntg-panel ntg-sidebar-pulse">
                <div className="ntg-sidebar-card-title">
                  {isCustomerView ? "Portfolio snapshot" : "Network pulse"}
                </div>
                <div className="ntg-mini-grid">
                  <MiniStat label={isCustomerView ? "Shipments" : "Gates"} value={isCustomerView ? displayedShipments.length : shipmentData.GATES.length} />
                  <MiniStat label={isCustomerView ? "Delivered" : "Corridors"} value={isCustomerView ? stats.delivered : shipmentData.CORRIDORS.length} tone="success" />
                  <MiniStat label="Active" value={stats.inTransit} tone="info" />
                  <MiniStat label={isCustomerView ? "Attention" : "Issues"} value={stats.atRisk + stats.exception} tone="warning" />
                </div>
              </div>

              <div className="ntg-panel ntg-live-card">
                <div className="ntg-live-header">
                  <div>
                    <div className="ntg-live-title">Live feed</div>
                    <div className="ntg-live-meta">
                      {fmtDate(now)} at {fmtTime(now)} CET
                    </div>
                    <div className="ntg-live-status" data-source={dataSource}>
                      {dataSource === "database" ? "Database synced" : dataSource === "fallback" ? "Fallback mode" : "Checking backend"}
                    </div>
                  </div>
                  <div className="ntg-live-indicator">
                    <span className="ntg-live-dot ntg-dot" />
                    LIVE
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="ntg-main">
            {view === "overview" && (
              <Overview
                shipments={displayedShipments}
                setSelected={setSelected}
                stats={stats}
                theme={theme}
                now={now}
                tweaks={tweaks}
                visibleTiers={visibleTiers}
                selectedShipmentId={selected?.id}
                audienceMode={tweaks.audienceMode}
                customerName={customerPortalName}
                onSimulate={simulateEvent}
                layout={layout}
              />
            )}
            {view === "shipments" && (
              <ShipmentList
                shipments={displayedShipments}
                onSelect={setSelected}
                selectedId={selected?.id}
                density={tweaks.density}
                accent={theme.accent}
                ink={theme.ink}
                paper={theme.paper}
                now={now}
                theme={theme}
                layout={layout}
              />
            )}
            {view === "exceptions" && (
              <ExceptionQueue
                shipments={displayedShipments}
                onSelect={setSelected}
                ink={theme.ink}
                paper={theme.paper}
                accent={theme.accent}
                density={tweaks.density}
                now={now}
                theme={theme}
                layout={layout}
              />
            )}
            {view === "analytics" && (
              <Analytics
                shipments={displayedShipments}
                ink={theme.ink}
                paper={theme.paper}
                accent={theme.accent}
                density={tweaks.density}
                theme={theme}
                layout={layout}
              />
            )}
          </main>

          {selected && (
            <ShipmentDetail
              shipment={shipments.find((shipment) => shipment.id === selected.id) || selected}
              onClose={() => setSelected(null)}
              accent={theme.accent}
              ink={theme.ink}
              paper={theme.paper}
              now={now}
              density={tweaks.density}
              mapVariant={tweaks.mapVariant}
              audienceMode={tweaks.audienceMode}
              visibleTiers={visibleTiers}
              theme={theme}
              layout={layout}
            />
          )}

          {recentEvent && (
            <div className="ntg-panel ntg-toast">
              <span className="ntg-live-dot ntg-dot ntg-tone-accent" />
              <div>
                <div className="ntg-toast-eyebrow">Gate event</div>
                <div className="ntg-toast-title">
                  <span className="ntg-toast-strong">{recentEvent.shipment}</span> passed <span className="ntg-toast-accent">{recentEvent.gate}</span>
                </div>
              </div>
            </div>
          )}

          <TweaksPanel title="Tweaks">
            <TweakSection label="Theme">
              <TweakToggle label="Dark mode" value={tweaks.dark} onChange={(value) => setTweak("dark", value)} />
            </TweakSection>
            <TweakSection label="Density">
              <TweakRadio label="" value={tweaks.density} options={["compact", "regular", "comfy"]} onChange={(value) => setTweak("density", value)} />
            </TweakSection>
            <TweakSection label="Map">
              <TweakRadio
                label="Style"
                value={tweaks.mapVariant}
                options={[
                  { value: "schematic", label: "Schematic" },
                  { value: "geographic", label: "Real map" },
                  { value: "europe-network", label: "Europe network" },
                ]}
                onChange={(value) => setTweak("mapVariant", value)}
              />
              <TweakToggle label="Tier 1 - Chokepoints" value={tweaks.showTier1} onChange={(value) => setTweak("showTier1", value)} />
              <TweakToggle label="Tier 2 - Ports and ferries" value={tweaks.showTier2} onChange={(value) => setTweak("showTier2", value)} />
              <TweakToggle label="Tier 3 - Logistics hubs" value={tweaks.showTier3} onChange={(value) => setTweak("showTier3", value)} />
              <TweakToggle label="Tier 4 - Customer sites" value={tweaks.showTier4} onChange={(value) => setTweak("showTier4", value)} />
            </TweakSection>
            <TweakSection label="Live data">
              <TweakButton label="Simulate gate event" onClick={simulateEvent} />
              <TweakButton label="Reset to initial state" onClick={resetShipments} secondary />
            </TweakSection>
          </TweaksPanel>
        </div>
      </div>
    </div>
  );
}

NTG.app.mount = (rootElement) => {
  ReactDOM.createRoot(rootElement).render(<App />);
};
