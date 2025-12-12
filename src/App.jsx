import React, { useState, useEffect } from 'react';
import { 
  Calculator, Wallet, Users, Info, ShieldCheck, 
  PiggyBank, Scale, X, BookOpen, AlertCircle, CalendarCheck, 
  Store, User, TrendingUp, CheckCircle2, FileText, Link as LinkIcon, MapPin, 
  Landmark, Gavel, ChevronRight, ArrowRight, Table2, List
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('salary');

  // --- STATES CHO TAB LƯƠNG ---
  const [income, setIncome] = useState(30000000);
  const [insuranceSalary, setInsuranceSalary] = useState(30000000);
  const [dependents, setDependents] = useState(1);
  const [useFullInsurance, setUseFullInsurance] = useState(true);
  
  // Mặc định Vùng 1 (4.96tr theo NĐ 74/2024/NĐ-CP)
  const [regionMinWage, setRegionMinWage] = useState(4960000); 

  // --- STATES CHO TAB HỘ KINH DOANH ---
  const [revenueYear, setRevenueYear] = useState(450000000); 
  const [businessType, setBusinessType] = useState(1.5); 

  const [showLegalModal, setShowLegalModal] = useState(false);

  // --- HẰNG SỐ LUẬT ---
  // CŨ (Hiện hành - Nghị quyết 954/2020)
  const OLD_SELF_DEDUCTION = 11000000;
  const OLD_DEPENDENT_DEDUCTION = 4400000;
  const OLD_BUSINESS_THRESHOLD = 100000000; 

  // MỚI (Luật sửa đổi thông qua 10/12/2025)
  const NEW_SELF_DEDUCTION = 15500000;
  const NEW_DEPENDENT_DEDUCTION = 6200000;
  const NEW_BUSINESS_THRESHOLD = 500000000; 
  
  // BẢO HIỂM (Cập nhật chuẩn 2025)
  const BASE_SALARY = 2340000; // Lương cơ sở từ 1/7/2024
  
  // Tỷ lệ bảo hiểm người lao động đóng
  const RATE_BHXH = 0.08; // 8%
  const RATE_BHYT = 0.015; // 1.5%
  const RATE_BHTN = 0.01; // 1%

  // --- LOGIC TÍNH TOÁN ---
  
  useEffect(() => {
    if (useFullInsurance) {
      setInsuranceSalary(income);
    }
  }, [income, useFullInsurance]);

  const handleInsuranceSalaryChange = (val) => {
    setInsuranceSalary(val);
    if (val !== income) setUseFullInsurance(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  // Hàm tính bảo hiểm chi tiết (Tách trần BHXH và BHTN)
  const calculateInsuranceDetail = (insSalary, regionMin) => {
    // 1. BHXH (8%) + BHYT (1.5%) -> Trần: 20 lần Lương cơ sở
    const capSocialHealth = BASE_SALARY * 20; // 46.800.000
    const baseSocialHealth = insSalary > capSocialHealth ? capSocialHealth : insSalary;
    const amtSocialHealth = baseSocialHealth * (RATE_BHXH + RATE_BHYT);

    // 2. BHTN (1%) -> Trần: 20 lần Lương tối thiểu vùng (Theo NĐ 74/2024)
    const capUnemployment = regionMin * 20;
    const baseUnemployment = insSalary > capUnemployment ? capUnemployment : insSalary;
    const amtUnemployment = baseUnemployment * RATE_BHTN;

    return {
      total: amtSocialHealth + amtUnemployment,
      capBHTN: capUnemployment,
      isCappedBHTN: insSalary > capUnemployment
    };
  };

  const calculateSalaryTax = (totalIncome, insSalary, selfDed, depDed, numDeps, isNewLaw, regionMin) => {
    // Tính bảo hiểm chính xác
    const insuranceObj = calculateInsuranceDetail(insSalary, regionMin);
    const insuranceAmt = insuranceObj.total;

    let taxableIncome = totalIncome - insuranceAmt - selfDed - (depDed * numDeps);
    if (taxableIncome < 0) taxableIncome = 0;

    let tax = 0;
    let brackets = [];

    if (isNewLaw) {
      // 5 BẬC (MỚI 2026)
      brackets = [
        { max: 10000000, rate: 0.05, label: "Bậc 1 (Đến 10 tr)" },
        { max: 30000000, rate: 0.10, label: "Bậc 2 (10 - 30 tr)" },
        { max: 60000000, rate: 0.20, label: "Bậc 3 (30 - 60 tr)" },
        { max: 100000000, rate: 0.30, label: "Bậc 4 (60 - 100 tr)" },
        { max: Infinity, rate: 0.35, label: "Bậc 5 (Trên 100 tr)" },
      ];
    } else {
      // 7 BẬC (CŨ)
      brackets = [
        { max: 5000000, rate: 0.05, label: "Bậc 1 (Đến 5 tr)" },
        { max: 10000000, rate: 0.10, label: "Bậc 2 (5 - 10 tr)" },
        { max: 18000000, rate: 0.15, label: "Bậc 3 (10 - 18 tr)" },
        { max: 32000000, rate: 0.20, label: "Bậc 4 (18 - 32 tr)" },
        { max: 52000000, rate: 0.25, label: "Bậc 5 (32 - 52 tr)" },
        { max: 80000000, rate: 0.30, label: "Bậc 6 (52 - 80 tr)" },
        { max: Infinity, rate: 0.35, label: "Bậc 7 (Trên 80 tr)" },
      ];
    }

    let remainingIncome = taxableIncome;
    let previousMax = 0;
    let details = [];

    for (let i = 0; i < brackets.length; i++) {
      if (remainingIncome <= 0) break;
      const range = brackets[i].max - previousMax;
      const taxableAmountInRange = Math.min(remainingIncome, range);
      const taxInRange = taxableAmountInRange * brackets[i].rate;
      if (taxableAmountInRange > 0) {
        details.push({ level: i + 1, label: brackets[i].label, rate: brackets[i].rate * 100, tax: taxInRange });
      }
      tax += taxInRange;
      remainingIncome -= taxableAmountInRange;
      previousMax = brackets[i].max;
    }

    return { 
      insurance: insuranceAmt, 
      taxableIncome, 
      tax, 
      netIncome: totalIncome - insuranceAmt - tax, 
      details,
      insuranceDetail: insuranceObj 
    };
  };

  const calculateBusinessTax = (revenue, ratePercent, threshold) => {
    if (revenue <= threshold) {
      return 0;
    }
    return revenue * (ratePercent / 100);
  };

  const oldSalaryResult = calculateSalaryTax(income, insuranceSalary, OLD_SELF_DEDUCTION, OLD_DEPENDENT_DEDUCTION, dependents, false, regionMinWage);
  const newSalaryResult = calculateSalaryTax(income, insuranceSalary, NEW_SELF_DEDUCTION, NEW_DEPENDENT_DEDUCTION, dependents, true, regionMinWage);

  const oldBusinessTax = calculateBusinessTax(revenueYear, businessType, OLD_BUSINESS_THRESHOLD);
  const newBusinessTax = calculateBusinessTax(revenueYear, businessType, NEW_BUSINESS_THRESHOLD);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white pb-24 pt-10 px-4 md:px-8 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                  <Landmark className="w-6 h-6 text-blue-200" />
                </div>
                <span className="text-blue-200 font-semibold tracking-wider text-sm uppercase">Công cụ Chính sách & Pháp luật</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 leading-tight">
                Tính Thuế TNCN 2025 - 2026
              </h1>
              <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90">
                Cập nhật chính xác theo Luật Thuế TNCN (sửa đổi) vừa được Quốc hội thông qua.
                So sánh quyền lợi giữa Luật cũ và Luật mới.
              </p>
            </div>

            <button 
              onClick={() => setShowLegalModal(true)}
              className="group flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-bold rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="bg-white text-blue-900 p-1.5 rounded-full">
                <Gavel className="w-4 h-4" />
              </div>
              <span>Xem Văn bản & Điểm mới</span>
              <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-16 relative z-20">
        
        {/* --- MAIN CARD CONTAINER --- */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          {/* TAB NAVIGATION */}
          <div className="flex flex-col md:flex-row border-b border-slate-100">
            <button
              onClick={() => setActiveTab('salary')}
              className={`flex-1 flex items-center justify-center gap-3 py-5 px-6 text-sm md:text-base font-bold transition-all relative ${
                activeTab === 'salary' 
                  ? 'text-blue-700 bg-blue-50/50' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-lg transition-colors ${activeTab === 'salary' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100'}`}>
                <User className="w-5 h-5" />
              </div>
              NGƯỜI LÀM CÔNG ĂN LƯƠNG
              {activeTab === 'salary' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
            </button>

            <button
              onClick={() => setActiveTab('business')}
              className={`flex-1 flex items-center justify-center gap-3 py-5 px-6 text-sm md:text-base font-bold transition-all relative ${
                activeTab === 'business' 
                  ? 'text-emerald-700 bg-emerald-50/50' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
               <div className={`p-2 rounded-lg transition-colors ${activeTab === 'business' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100'}`}>
                <Store className="w-5 h-5" />
              </div>
              HỘ KINH DOANH CÁ THỂ
              {activeTab === 'business' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t-full"></div>}
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* --- TAB CONTENT: SALARY --- */}
            {activeTab === 'salary' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* LEFT: INPUTS */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Thông tin thu nhập
                    </h3>
                    
                    <div className="space-y-5">
                      {/* Income Input */}
                      <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-focus-within:text-blue-700 transition-colors">Tổng thu nhập (Tháng)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={income}
                            onChange={(e) => setIncome(Number(e.target.value))}
                            className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-800 shadow-sm transition-all"
                          />
                          <span className="absolute right-4 top-3.5 text-slate-400 text-xs font-bold pointer-events-none">VND</span>
                        </div>
                      </div>

                      {/* Insurance Salary Input */}
                      <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-focus-within:text-blue-700 transition-colors">Lương đóng bảo hiểm</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={insuranceSalary}
                            onChange={(e) => handleInsuranceSalaryChange(Number(e.target.value))}
                            className={`w-full pl-4 pr-12 py-3.5 border rounded-xl outline-none font-bold shadow-sm transition-all ${
                              useFullInsurance 
                                ? 'bg-blue-50/50 border-blue-200 text-blue-800 focus:ring-4 focus:ring-blue-100' 
                                : 'bg-white border-slate-200 text-slate-800 focus:ring-4 focus:ring-slate-100 focus:border-slate-400'
                            }`}
                          />
                          <span className="absolute right-4 top-3.5 text-slate-400 text-xs font-bold pointer-events-none">VND</span>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer group/chk">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${useFullInsurance ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={useFullInsurance}
                                onChange={(e) => setUseFullInsurance(e.target.checked)}
                              />
                              {useFullInsurance && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-xs font-medium text-slate-600 group-hover/chk:text-blue-700">Đóng full lương</span>
                          </label>

                          {/* Region Selector */}
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 hover:border-blue-300 transition-colors">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <select 
                              value={regionMinWage} 
                              onChange={(e) => setRegionMinWage(Number(e.target.value))}
                              className="text-xs bg-transparent text-slate-600 font-semibold border-none focus:ring-0 cursor-pointer p-0 pr-1"
                            >
                              <option value={4960000}>Vùng 1</option>
                              <option value={4410000}>Vùng 2</option>
                              <option value={3860000}>Vùng 3</option>
                              <option value={3450000}>Vùng 4</option>
                            </select>
                          </div>
                        </div>

                         {/* Warning if capped */}
                         {insuranceSalary > regionMinWage * 20 && (
                            <div className="mt-2 text-[11px] text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              Đã vượt trần BHTN ({formatCurrency(regionMinWage*20)})
                            </div>
                          )}
                      </div>

                      {/* Dependents Input */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số người phụ thuộc</label>
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-1">
                          <button 
                            onClick={() => setDependents(Math.max(0, dependents - 1))}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 font-bold transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={dependents}
                            onChange={(e) => setDependents(Math.max(0, Number(e.target.value)))}
                            className="flex-1 text-center font-bold text-slate-800 outline-none"
                          />
                          <button 
                            onClick={() => setDependents(dependents + 1)}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-5 -mr-5 w-24 h-24 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
                    <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2 relative z-10">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Quy định Mới (2026)
                    </h4>
                    <ul className="space-y-2 relative z-10">
                      <li className="flex justify-between text-sm">
                        <span className="text-slate-600">GT Bản thân:</span>
                        <span className="font-bold text-blue-800">15.5 triệu</span>
                      </li>
                      <li className="flex justify-between text-sm">
                        <span className="text-slate-600">GT Phụ thuộc:</span>
                        <span className="font-bold text-blue-800">6.2 triệu</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* RIGHT: RESULTS */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* COMPARISON CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* CARD: OLD LAW */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative group hover:border-slate-300 transition-all">
                      <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded">Hiện Hành</div>
                      
                      <div className="mb-6">
                         <div className="text-slate-500 text-xs font-bold uppercase mb-1">Thực Lĩnh (Net)</div>
                         <div className="text-3xl font-extrabold text-slate-700 tracking-tight group-hover:scale-105 transition-transform origin-left">
                           {formatCurrency(oldSalaryResult.netIncome)}
                         </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500">Thuế phải nộp</span>
                           <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">{formatCurrency(oldSalaryResult.tax)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500">Bảo hiểm</span>
                           <span className="text-slate-600 font-medium">{formatCurrency(oldSalaryResult.insurance)}</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD: NEW LAW (HIGHLIGHTED) */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-xl shadow-blue-200 relative overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                      <div className="absolute top-0 right-0 p-4">
                        <Scale className="w-24 h-24 text-white opacity-5 rotate-12 -mt-4 -mr-4" />
                      </div>
                      
                      <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-blue-900 bg-white px-2 py-1 rounded shadow-sm z-10">Luật Mới 2026</div>

                      <div className="mb-6 relative z-10">
                         <div className="text-blue-100 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                            Thực Lĩnh (Net)
                         </div>
                         <div className="text-4xl font-extrabold text-white tracking-tight">
                           {formatCurrency(newSalaryResult.netIncome)}
                         </div>
                         {newSalaryResult.netIncome > oldSalaryResult.netIncome && (
                            <div className="inline-flex items-center gap-1.5 mt-2 bg-green-400/20 border border-green-400/30 rounded-lg px-2.5 py-1 text-xs font-bold text-green-100">
                              <TrendingUp className="w-3.5 h-3.5" />
                              Tăng {formatCurrency(newSalaryResult.netIncome - oldSalaryResult.netIncome)}
                            </div>
                         )}
                      </div>

                      <div className="space-y-3 pt-4 border-t border-white/10 relative z-10">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-blue-100">Thuế phải nộp</span>
                           <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">{formatCurrency(newSalaryResult.tax)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-blue-200">Bảo hiểm</span>
                           <span className="text-blue-100 font-medium">{formatCurrency(newSalaryResult.insurance)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DATA TABLE */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Bảng kê chi tiết</h3>
                      <span className="text-[10px] font-semibold text-slate-400 bg-white border px-2 py-0.5 rounded">Đơn vị: VND</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-slate-400 text-xs uppercase bg-white border-b border-slate-50">
                            <th className="px-6 py-3 font-bold text-left w-1/3">Khoản mục</th>
                            <th className="px-6 py-3 font-bold text-right w-1/3">Luật Cũ</th>
                            <th className="px-6 py-3 font-bold text-right text-blue-600 w-1/3">Luật Mới (2026)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-600">Tổng thu nhập</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(income)}</td>
                            <td className="px-6 py-4 text-right font-bold text-blue-800">{formatCurrency(income)}</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-600">
                              Bảo hiểm bắt buộc
                              <div className="text-[10px] text-slate-400 font-normal">Đã tách trần BHXH & BHTN</div>
                            </td>
                            <td className="px-6 py-4 text-right text-red-500 font-medium">-{formatCurrency(oldSalaryResult.insurance)}</td>
                            <td className="px-6 py-4 text-right text-red-500 font-medium">-{formatCurrency(newSalaryResult.insurance)}</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-600">Giảm trừ gia cảnh</td>
                            <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                              -{formatCurrency(OLD_SELF_DEDUCTION + (dependents * OLD_DEPENDENT_DEDUCTION))}
                            </td>
                            <td className="px-6 py-4 text-right text-emerald-600 font-bold">
                              -{formatCurrency(NEW_SELF_DEDUCTION + (dependents * NEW_DEPENDENT_DEDUCTION))}
                            </td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="px-6 py-4 font-bold text-slate-700">Thu nhập tính thuế</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(oldSalaryResult.taxableIncome)}</td>
                            <td className="px-6 py-4 text-right font-bold text-blue-800">{formatCurrency(newSalaryResult.taxableIncome)}</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 font-bold text-slate-700">Thuế TNCN phải nộp</td>
                            <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(oldSalaryResult.tax)}</td>
                            <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(newSalaryResult.tax)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* --- TAB CONTENT: BUSINESS --- */}
            {activeTab === 'business' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* LEFT: INPUTS */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      Thông tin kinh doanh
                    </h3>
                    
                    <div className="space-y-5">
                      <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-focus-within:text-emerald-700 transition-colors">Doanh thu cả năm</label>
                        <div className="relative">
                           <input
                            type="number"
                            value={revenueYear}
                            onChange={(e) => setRevenueYear(Number(e.target.value))}
                            className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-bold text-slate-800 shadow-sm transition-all"
                          />
                          <span className="absolute right-4 top-3.5 text-slate-400 text-xs font-bold pointer-events-none">VND</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-2 font-medium px-2">
                          ≈ {formatCurrency(revenueYear/12)} / tháng
                        </div>
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngành nghề (Tỷ lệ thuế khoán)</label>
                        <div className="relative">
                          <select
                            value={businessType}
                            onChange={(e) => setBusinessType(Number(e.target.value))}
                            className="w-full pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-medium text-slate-700 appearance-none shadow-sm cursor-pointer"
                          >
                            <option value="1.5">Phân phối, cung cấp hàng hóa (1.5%)</option>
                            <option value="4.5">Dịch vụ, xây dựng không bao thầu (4.5%)</option>
                            <option value="3.0">Sản xuất, vận tải, hàng hóa (3.0%)</option>
                            <option value="7.0">Cho thuê tài sản, đại lý xổ số (7.0%)</option>
                          </select>
                           <div className="absolute right-4 top-4 pointer-events-none">
                             <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: RESULTS */}
                <div className="lg:col-span-7 space-y-6">
                   {/* HERO RESULT CARD */}
                   <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl p-8 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden">
                      {/* Decorative Background */}
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-teal-400/10 rounded-full blur-2xl"></div>

                      <div className="relative z-10">
                        <h3 className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-6 border-b border-emerald-700 pb-2 inline-block">
                          Ngưỡng Doanh Thu Miễn Thuế
                        </h3>
                        
                        <div className="flex flex-col md:flex-row items-baseline gap-4 md:gap-8 mb-8">
                          <div className="opacity-60 grayscale">
                            <div className="text-sm font-medium mb-1">Luật Hiện Hành</div>
                            <div className="text-2xl font-bold line-through decoration-2 decoration-emerald-500/50">100 triệu/năm</div>
                          </div>
                          <ArrowRight className="hidden md:block w-6 h-6 text-emerald-400 opacity-50" />
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-emerald-300">LUẬT MỚI 2026</span>
                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">CHỐT</span>
                             </div>
                            <div className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
                              500 <span className="text-2xl md:text-3xl font-bold opacity-80">triệu/năm</span>
                            </div>
                          </div>
                        </div>
                        
                        {revenueYear <= NEW_BUSINESS_THRESHOLD ? (
                          <div className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/30">
                            <CheckCircle2 className="w-5 h-5" />
                            CHÚC MỪNG! BẠN ĐƯỢC MIỄN 100% THUẾ
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-orange-500/90 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg backdrop-blur-sm">
                            <AlertCircle className="w-5 h-5" />
                            VƯỢT NGƯỠNG - NỘP THUẾ TRÊN TOÀN BỘ DOANH THU
                          </div>
                        )}
                      </div>
                   </div>

                  {/* COMPARISON CARDS */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Số tiền phải nộp (Hiện tại)</div>
                        <div className="text-2xl font-extrabold text-slate-700">{formatCurrency(oldBusinessTax)}</div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                        Tính trên 100% doanh thu
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                       <div>
                         <div className="text-xs font-bold text-emerald-700 uppercase mb-2">Số tiền phải nộp (2026)</div>
                         <div className="text-2xl font-extrabold text-emerald-700">{formatCurrency(newBusinessTax)}</div>
                       </div>
                       <div className="mt-4 pt-4 border-t border-emerald-200/50 text-[10px] text-emerald-600 font-bold">
                         {newBusinessTax === 0 ? 'TIẾT KIỆM 100% TIỀN THUẾ' : 'Vẫn tính trên 100% doanh thu'}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- LEGAL MODAL --- */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300 border border-white/20">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                   <Scale className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Cẩm Nang Pháp Lý & Điểm Mới 2026</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Dựa trên Luật Thuế TNCN (sửa đổi) & Nghị định 74/2024/NĐ-CP</p>
                </div>
              </div>
              <button onClick={() => setShowLegalModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-0 overflow-y-auto custom-scrollbar bg-slate-50/50">
              <div className="space-y-8 p-8">
                
                {/* Section 1: Salary Tax */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-blue-50/30 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-blue-200">1</span>
                    <h3 className="text-lg font-bold text-blue-900">
                      Thuế Thu Nhập Cá Nhân (Lương & Tiền Công)
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <List className="w-4 h-4 text-blue-600" />
                      Chi tiết thay đổi về Giảm trừ & Biểu thuế
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-4 text-left w-1/3">Nội dung</th>
                            <th className="p-4 text-left w-1/3">Hiện hành (Luật 2014)</th>
                            <th className="p-4 text-left w-1/3 text-blue-700 bg-blue-50/50">Mới (Luật 2026)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-4 font-medium text-slate-600">Giảm trừ bản thân</td>
                            <td className="p-4 text-slate-500">11 triệu đồng/tháng</td>
                            <td className="p-4 font-bold text-blue-700 bg-blue-50/30">15.5 triệu đồng/tháng</td>
                          </tr>
                          <tr>
                            <td className="p-4 font-medium text-slate-600">Giảm trừ phụ thuộc</td>
                            <td className="p-4 text-slate-500">4.4 triệu đồng/người</td>
                            <td className="p-4 font-bold text-blue-700 bg-blue-50/30">6.2 triệu đồng/người</td>
                          </tr>
                          <tr>
                            <td className="p-4 font-medium text-slate-600 align-top">Biểu thuế lũy tiến</td>
                            <td className="p-4 align-top">
                              <span className="font-bold text-slate-700 block mb-2">7 Bậc:</span>
                              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-500">
                                <li>Đến 5tr: 5%</li>
                                <li>5-10tr: 10%</li>
                                <li>10-18tr: 15%</li>
                                <li>18-32tr: 20%</li>
                                <li>32-52tr: 25%</li>
                                <li>52-80tr: 30%</li>
                                <li>Trên 80tr: 35%</li>
                              </ul>
                            </td>
                            <td className="p-4 align-top bg-blue-50/30">
                              <span className="font-bold text-blue-700 block mb-2">5 Bậc (Rút gọn):</span>
                              <ul className="list-disc pl-4 space-y-1 text-xs text-blue-800">
                                <li><strong className="text-blue-900">Đến 10tr:</strong> 5% (Tăng khoảng 5tr)</li>
                                <li><strong className="text-blue-900">10-30tr:</strong> 10% (Gộp bậc cũ 10&15%)</li>
                                <li><strong className="text-blue-900">30-60tr:</strong> 20% (Giảm từ 25%)</li>
                                <li><strong className="text-blue-900">60-100tr:</strong> 30%</li>
                                <li><strong className="text-blue-900">Trên 100tr:</strong> 35%</li>
                              </ul>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800 flex gap-3">
                      <Info className="w-5 h-5 flex-shrink-0" />
                      <p>
                        <strong>Ý nghĩa:</strong> Việc rút gọn bậc thuế và nới rộng khoảng cách thu nhập (đặc biệt là bậc 2 lên đến 30 triệu với thuế suất chỉ 10%) giúp giảm mạnh số thuế phải nộp cho nhóm thu nhập trung bình khá.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 2: Business Tax */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-emerald-50/30 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-emerald-200">2</span>
                    <h3 className="text-lg font-bold text-emerald-900">
                      Thuế Đối Với Hộ Kinh Doanh Cá Thể
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Ngưỡng doanh thu miễn thuế</h4>
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div>
                            <div className="text-xs text-slate-400 font-bold uppercase">Cũ</div>
                            <div className="text-xl font-bold text-slate-500 line-through">100 triệu</div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-300" />
                          <div>
                            <div className="text-xs text-emerald-600 font-bold uppercase">Mới (2026)</div>
                            <div className="text-3xl font-extrabold text-emerald-600">500 triệu</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Tỷ lệ thuế khoán theo ngành nghề</h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-500">
                              <tr>
                                <th className="p-2 text-left">Ngành nghề</th>
                                <th className="p-2 text-right">Tổng Thuế (GTGT+TNCN)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              <tr>
                                <td className="p-2">Phân phối, cung cấp hàng hóa</td>
                                <td className="p-2 text-right font-bold">1.5%</td>
                              </tr>
                              <tr>
                                <td className="p-2">Sản xuất, vận tải, hàng hóa kèm DV</td>
                                <td className="p-2 text-right font-bold">4.5%</td>
                              </tr>
                              <tr>
                                <td className="p-2">Dịch vụ, xây dựng (không vật liệu)</td>
                                <td className="p-2 text-right font-bold">7.0%</td>
                              </tr>
                              <tr>
                                <td className="p-2">Cho thuê tài sản, đại lý...</td>
                                <td className="p-2 text-right font-bold">10.0%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                      <div>
                        <h5 className="text-sm font-bold text-orange-800 mb-1">Lưu ý quan trọng về cách tính thuế khoán</h5>
                        <p className="text-xs text-orange-700 leading-relaxed">
                          Theo nguyên tắc thuế khoán hiện hành, nếu doanh thu của bạn vượt ngưỡng miễn thuế (500 triệu), bạn sẽ phải nộp thuế trên <strong>TOÀN BỘ DOANH THU</strong> phát sinh trong năm đó, chứ không phải chỉ nộp phần chênh lệch vượt quá 500 triệu.
                          <br/>
                          <em>Ví dụ: Doanh thu 501 triệu → Tính thuế 1.5% x 501 triệu = 7.515.000 VNĐ.</em>
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
                
                {/* Sources */}
                <section className="border-t border-slate-200 pt-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Căn cứ pháp lý & Nguồn tin</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="#" className="block p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-sm text-slate-700 group-hover:text-blue-700">Luật Thuế TNCN (Sửa đổi)</span>
                      </div>
                      <p className="text-xs text-slate-500">Thông qua bởi Quốc hội ngày 10/12/2025. Hiệu lực thi hành từ 01/07/2026.</p>
                    </a>
                    <a href="#" className="block p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-sm text-slate-700 group-hover:text-emerald-700">Nghị định 74/2024/NĐ-CP</span>
                      </div>
                      <p className="text-xs text-slate-500">Quy định mức lương tối thiểu vùng, là cơ sở tính trần bảo hiểm thất nghiệp (BHTN).</p>
                    </a>
                  </div>
                </section>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end sticky bottom-0 z-20">
              <button 
                onClick={() => setShowLegalModal(false)}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-bold shadow-lg shadow-slate-900/20 active:scale-95 transform duration-150"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;