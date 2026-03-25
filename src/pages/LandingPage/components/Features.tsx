import { CreditCard, Lock, Database, Handshake, Settings} from 'lucide-react'
export default function Features() {
  const features = [
    {
      id: 1,
      title: 'Multi-Tenant Architecture',
      description: 'Support for multiple service providers, issuing banks, and affiliates operating independently within a unified platform.',
      icon: <Database className="w-8 h-8" />
    },
    {
      id: 2,
      title: 'Issuing Bank Integration',
      description: 'Seamlessly integrate with your preferred issuing banks and manage your card programs with complete control.',
      icon: <CreditCard className="w-8 h-8" />
    },
    {
      id: 3,
      title: 'Affiliate Management',
      description: 'Easy onboarding and management of affiliates with flexible commission structures and real-time tracking.',
      icon: <Handshake className="w-8 h-8" />
    },
    {
      id: 4,
      title: 'Super Admin Control',
      description: 'Comprehensive management dashboard for service providers to oversee all operations and stakeholders.',
      icon: <Settings className="w-8 h-8" />
    },
    {
      id: 5,
      title: 'Real-Time Monitoring',
      description: 'Track transactions, monitor performance, and get instant insights into your card operations.',
      icon: <Database className="w-8 h-8" />
    },
    {
      id: 6,
      title: 'Security First',
      description: 'Enterprise-grade security with role-based access control and compliance with industry standards.',
      icon: <Lock className="w-8 h-8" />
    }
  ]

  return (
    <section className="py-20 md:py-32 px-5 bg-white dark:bg-gray-900" id="features">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Powerful Features for Card Management
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to manage card operations at scale
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(feature => (
            <div key={feature.id} className=" p-8 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-800 hover:border-orange-600 dark:hover:border-orange-500 hover:shadow-xl dark:hover:shadow-orange-900/20 hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
