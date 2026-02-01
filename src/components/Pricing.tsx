import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Pricing = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // Switch par défaut sur "1 enfant" (false)
  const [isFamily, setIsFamily] = useState(false);

  
  const nextYear = new Date().getFullYear() + 1;

  // Récupérer les plans depuis la base de données
  const { data: subscriptionPlans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('duration_months', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Trouver les plans mensuel et annuel
  const monthlyPlan = subscriptionPlans?.find(p => p.billing_period === 'monthly');
  const annualPlan = subscriptionPlans?.find(p => p.billing_period === 'annual');

  // Obtenir le prix total en fonction du switch famille
  const getTotalPrice = (plan: any) => {
    if (!plan) return 0;
    return isFamily ? plan.total_family : plan.total_single;
  };

  // Calculer la date de fin (aujourd'hui + 10 mois)
  const getEndDate = () => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 10);
    return endDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  const plans = [
    {
      name: "Formule Scolaire",
      price: annualPlan ? `${getTotalPrice(annualPlan).toLocaleString('fr-FR')} DA` : '---',
      period: "",
      description: `Paiement unique pour 10 mois jusqu'au ${getEndDate()}`,
      features: [
        "Tous les cours de votre niveau",
        "Exercices et corrigés",
        "Vidéos explicatives",
        "Suivi de progression",
        "Support prioritaire",
        "Examens blancs",
      ],
      highlighted: true,
      planData: annualPlan,
    },
    {
      name: "Formule Mensuelle",
      price: monthlyPlan ? `${getTotalPrice(monthlyPlan).toLocaleString('fr-FR')} DA` : '---',
      period: "",
      description: "Paiement mensuel",
      features: [
        "Tous les cours de votre niveau",
        "Exercices et corrigés",
        "Vidéos explicatives",
        "Suivi de progression",
        "Support prioritaire",
        "Examens blancs",
      ],
      highlighted: false,
      planData: monthlyPlan,
    },
  ];

  if (isLoading) {
    return (
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg text-gray-600">{t("common.loading") || "Chargement..."}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t("pricing.title")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Switch pour 1 enfant vs Famille */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label 
            htmlFor="family-switch" 
            className={`text-lg font-semibold cursor-pointer transition-colors ${!isFamily ? 'text-blue-600' : 'text-gray-500'}`}
          >
            {t("pricing.switchOneChild")}
          </Label>
          <Switch
            id="family-switch"
            checked={isFamily}
            onCheckedChange={setIsFamily}
          />
          <Label 
            htmlFor="family-switch" 
            className={`text-lg font-semibold cursor-pointer transition-colors ${isFamily ? 'text-blue-600' : 'text-gray-500'}`}
          >
            {t("pricing.switchFamily")}
          </Label>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 ${
                plan.highlighted
                  ? "border-2 border-blue-600 shadow-xl"
                  : "border border-gray-200"
              } bg-white relative`}
            >
              <Button
                onClick={() => {
                  if (plan.planData) {
                    navigate("/paiement", {
                      state: {
                        planId: plan.planData.id,
                        planName: plan.name,
                        price: getTotalPrice(plan.planData),
                        isFamily: isFamily,
                        billingPeriod: plan.planData.billing_period,
                        monthsCount: 10
                      }
                    });
                  }
                }}
                disabled={!plan.planData}
                className={`w-full font-bold mb-6 text-lg py-6 ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                    : "bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Choisir {plan.name}
              </Button>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                {plan.description && (
                  <p className={`text-sm mb-4 ${i18n.language === 'ar' ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{plan.description}</p>
                )}
                <div className="flex items-baseline justify-center gap-1 relative mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-600">{plan.period}</span>}
                  {plan.highlighted && (
                    <span className="absolute -top-5 -right-2 bg-red-500 text-white text-lg font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
                      -30%
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
