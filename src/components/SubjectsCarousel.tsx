import { Check, BookOpen, Calculator, Globe, Beaker, Brain, Languages, MapPin, Lightbulb, Laptop, GraduationCap, Book } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";

const SubjectsCarousel = () => {
  const { t } = useTranslation();
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);

  const subjects = [
    { nameKey: "subjects.math", icon: Calculator, color: "bg-blue-500" },
    { nameKey: "subjects.physics", icon: Beaker, color: "bg-purple-500" },
    { nameKey: "subjects.french", icon: Languages, color: "bg-pink-500" },
    { nameKey: "subjects.arabic", icon: BookOpen, color: "bg-green-500" },
    { nameKey: "subjects.history", icon: Book, color: "bg-orange-500" },
    { nameKey: "subjects.chemistry", icon: Brain, color: "bg-cyan-500" },
    { nameKey: "subjects.english", icon: Globe, color: "bg-red-500" },
    { nameKey: "subjects.naturalSciences", icon: Lightbulb, color: "bg-emerald-500" },
    { nameKey: "subjects.geography", icon: MapPin, color: "bg-teal-500" },
    { nameKey: "subjects.philosophy", icon: GraduationCap, color: "bg-indigo-500" },
    { nameKey: "subjects.islamicEducation", icon: Book, color: "bg-amber-600" },
    { nameKey: "subjects.computerScience", icon: Laptop, color: "bg-violet-500" },
  ];

  const features = [
    "subjects.features.downloadablePdf",
    "subjects.features.examPrep",
    "subjects.features.exercises",
  ];

  useEffect(() => {
    const scroll1 = scrollRef1.current;
    const scroll2 = scrollRef2.current;
    
    if (!scroll1 || !scroll2) return;

    let animationId: number;
    let position1 = 0;
    let position2 = -(scroll2.scrollWidth / 2);

    const animate = () => {
      position1 -= 0.5;
      position2 += 0.5;

      if (Math.abs(position1) >= scroll1.scrollWidth / 2) {
        position1 = 0;
      }
      if (position2 >= 0) {
        position2 = -(scroll2.scrollWidth / 2);
      }

      scroll1.style.transform = `translateX(${position1}px)`;
      scroll2.style.transform = `translateX(${position2}px)`;

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  const row1Subjects = subjects.slice(0, 6);
  const row2Subjects = subjects.slice(6);

  return (
    <section className="py-16 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            {t("subjects.title")}
          </h2>
          
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            {features.map((featureKey, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700 font-medium">{t(featureKey)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* First Row - Scrolling Left */}
        <div className="relative mb-6 overflow-hidden">
          <div ref={scrollRef1} className="flex gap-4 will-change-transform">
            {[...row1Subjects, ...row1Subjects, ...row1Subjects, ...row1Subjects].map((subject, index) => {
              const Icon = subject.icon;
              return (
                <div
                  key={`${subject.nameKey}-${index}`}
                  className="flex-shrink-0 w-auto bg-white rounded-xl shadow-md px-4 py-3 flex items-center gap-3 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-10 h-10 ${subject.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-800 text-sm whitespace-nowrap">{t(subject.nameKey)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Second Row - Scrolling Right */}
        <div className="relative overflow-hidden">
          <div ref={scrollRef2} className="flex gap-4 will-change-transform">
            {[...row2Subjects, ...row2Subjects, ...row2Subjects, ...row2Subjects].map((subject, index) => {
              const Icon = subject.icon;
              return (
                <div
                  key={`${subject.nameKey}-${index}`}
                  className="flex-shrink-0 w-auto bg-white rounded-xl shadow-md px-4 py-3 flex items-center gap-3 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-10 h-10 ${subject.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-800 text-sm whitespace-nowrap">{t(subject.nameKey)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubjectsCarousel;
