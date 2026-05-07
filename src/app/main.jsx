const NTG = window.NTG = window.NTG || {};
NTG.app = NTG.app || {};

const { useState, useEffect, useMemo } = React;
const shipmentData = NTG.domain.shipments.data;
const shipmentService = NTG.domain.shipments.service;
const { useTheme, cardStyle, syncThemeDocument } = NTG.app.theme;
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
      { id: "exceptions", label: "Exceptions", badge: stats.atRisk + stats.exception, badgeColor: theme.warning },
      { id: "analytics", label: "Analytics", badge: null },
    ] : []),
  ];

  const framePad = layout.isNarrow ? 12 : layout.isMobile ? 14 : 20;
  const sidebarWidth = layout.isTablet ? 264 : 286;

  return (
    <div className="ntg-app-shell" style={{ minHeight: "100%", background: theme.backdrop, color: theme.ink, position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, background: theme.glow, pointerEvents: "none" }} />

      <div style={{ position: "relative", padding: framePad }}>
        <div style={{
          minHeight: `calc(100vh - ${framePad * 2}px)`,
          display: "grid",
          gridTemplateColumns: layout.isMobile ? "1fr" : `${sidebarWidth}px minmax(0, 1fr)`,
          gap: layout.isNarrow ? 12 : 18,
          alignItems: "start",
        }}>
          <aside style={{
            ...cardStyle(theme, { background: theme.panel, radius: layout.isMobile ? 24 : 32, shadow: theme.shadow }),
            padding: layout.isNarrow ? 18 : 22,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            minHeight: layout.isMobile ? "auto" : `calc(100vh - ${framePad * 2}px)`,
            position: layout.isMobile ? "static" : "sticky",
            top: framePad,
                animation: "riseIn 0.5s both",
              }}>
            <Brand theme={theme} />

            <div style={{
              ...cardStyle(theme, {
                background: `linear-gradient(145deg, ${theme.surfaceAlt} 0%, ${theme.surface} 100%)`,
                radius: 26,
                shadow: "none",
              }),
              padding: layout.isNarrow ? 16 : 18,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                right: -42,
                top: -42,
                width: 152,
                height: 152,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${theme.accentWash} 0%, transparent 70%)`,
              }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                  Control tower
                </div>
                <div style={{ marginTop: 10, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: layout.isNarrow ? 30 : 34, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
                  Denmark freight visibility
                </div>
                <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.65, color: theme.inkMuted }}>
                  A calmer, more premium dashboard for checkpoint-confirmed shipment progress.
                </p>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>
                Audience mode
              </div>
              <AudienceSwitch value={tweaks.audienceMode} onChange={(mode) => setTweak("audienceMode", mode)} theme={theme} />
              {isCustomerView && (
                <div style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 18,
                  background: theme.accentWash,
                  border: `1px solid ${theme.line}`,
                  fontSize: 11,
                  color: theme.inkMuted,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.03em",
                }}>
                  Portal account: {customerPortalName}
                </div>
              )}
            </div>

            <nav style={{
              display: "grid",
              gridTemplateColumns: layout.isMobile ? "repeat(auto-fit, minmax(120px, 1fr))" : "1fr",
              gap: 10,
            }}>
              {navItems.map((item) => {
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`ntg-nav-button${active ? " is-active" : ""}`}
                    style={{
                      padding: "14px 15px",
                      borderRadius: 20,
                      background: active ? theme.surfaceAlt : "transparent",
                      color: theme.ink,
                      border: `1px solid ${active ? theme.lineStrong : "transparent"}`,
                      boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.03)" : "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      textAlign: "left",
                    }}
                  >
                    <span>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ display: "block", marginTop: 4, fontSize: 11, color: active ? theme.inkMuted : theme.inkSoft }}>
                        {item.id === "overview" && "Executive summary"}
                        {item.id === "shipments" && "Live tracking list"}
                        {item.id === "exceptions" && "Flagged operational cases"}
                        {item.id === "analytics" && "Network performance"}
                      </span>
                    </span>
                    {item.badge != null && (
                      <span style={{
                        minWidth: 28,
                        padding: "5px 8px",
                        borderRadius: 999,
                        background: item.badgeColor ? `${item.badgeColor}22` : theme.accentWash,
                        color: item.badgeColor || theme.accent,
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        textAlign: "center",
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div style={{ marginTop: layout.isMobile ? 0 : "auto", display: "grid", gap: 12 }}>
              <div style={{
                ...cardStyle(theme, { background: theme.surface, radius: 26, shadow: "none" }),
                padding: "14px 14px 16px",
              }}>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>
                  {isCustomerView ? "Portfolio snapshot" : "Network pulse"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <MiniStat label={isCustomerView ? "Shipments" : "Gates"} value={isCustomerView ? displayedShipments.length : shipmentData.GATES.length} theme={theme} />
                  <MiniStat label={isCustomerView ? "Delivered" : "Corridors"} value={isCustomerView ? stats.delivered : shipmentData.CORRIDORS.length} theme={theme} accent={theme.success} />
                  <MiniStat label="Active" value={stats.inTransit} theme={theme} accent={theme.info} />
                  <MiniStat label={isCustomerView ? "Attention" : "Issues"} value={stats.atRisk + stats.exception} theme={theme} accent={theme.warning} />
                </div>
              </div>

              <div style={{
                ...cardStyle(theme, { background: theme.paper, radius: 22, shadow: "none" }),
                padding: "12px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                      Live feed
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: theme.inkMuted }}>
                      {fmtDate(now)} at {fmtTime(now)} CET
                    </div>
                    <div style={{ marginTop: 6, fontSize: 10, color: dataSource === "database" ? theme.success : theme.warning, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {dataSource === "database" ? "Database synced" : dataSource === "fallback" ? "Fallback mode" : "Checking backend"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.success, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.08em" }}>
                    <span className="ntg-live-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: theme.success, display: "inline-block" }} />
                    LIVE
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main style={{
            minWidth: 0,
            minHeight: layout.isMobile ? "auto" : `calc(100vh - ${framePad * 2}px)`,
            display: "flex",
            flexDirection: "column",
            animation: "riseIn 0.55s both",
          }}>
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
            <div className="ntg-toast" style={{
              position: "fixed",
              right: framePad,
              bottom: framePad,
              zIndex: 200,
              ...cardStyle(theme, {
                background: theme.panelSolid,
                borderColor: theme.lineStrong,
                radius: 22,
                shadow: theme.shadow,
              }),
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              <span className="ntg-live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: theme.accent, display: "inline-block" }} />
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: theme.inkMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                  Gate event
                </div>
                <div style={{ marginTop: 5, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{recentEvent.shipment}</span> passed <span style={{ color: theme.accent }}>{recentEvent.gate}</span>
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
