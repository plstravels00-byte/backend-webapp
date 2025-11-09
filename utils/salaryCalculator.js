export function calculateSalary({ scheme, totalEarnings=0, uberCommission=0, cngTotal=0, pickups=0 }) {
  if (!scheme) return { finalSalary: 0, incentive: 0, bonus: 0, cngBonus: 0, operatorCut: 0 };

  const target     = Number(scheme.target || 0);
  const belowPct   = Number(scheme.incentiveBelow || 30) / 100;
  const abovePct   = Number(scheme.incentiveAbove || 60) / 100;
  const operatorPct= Number(scheme.operatorCommissionPercent || 10) / 100;
  const cngPct     = Number(scheme.cngAllowancePercent || 30) / 100;

  let incentive = 0;
  if (scheme.frequency === "rental") {
    incentive = 0;
  } else if (target > 0) {
    incentive = totalEarnings <= target
      ? totalEarnings * belowPct
      : target * belowPct + (totalEarnings - target) * abovePct;
  }

  let bonus = 0;
  if (scheme.frequency === "daily"
      && (scheme.extraRule || "").includes("daily_15_pickups_300")
      && pickups >= 15 && totalEarnings >= target) {
    bonus = 300;
  }

  const operatorCut = uberCommission * operatorPct; // deduct
  const cngBonus    = cngTotal * cngPct;            // add
  const finalSalary = totalEarnings + incentive + bonus + cngBonus - operatorCut;

  return { finalSalary, incentive, bonus, cngBonus, operatorCut, breakdown: { target, belowPct, abovePct } };
}
