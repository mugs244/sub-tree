import { Carousel } from "@/components/cells"
import { CategoryCard } from "@/components/organisms"

// Sub-shop departments (Food & beverage comes later with its own design).
export const categories: { id: number; name: string; handle: string }[] = [
  { id: 1, name: "Fashion", handle: "fashion" },
  { id: 2, name: "Beauty", handle: "beauty" },
  { id: 3, name: "Books", handle: "books" },
  { id: 4, name: "Courses", handle: "courses" },
  { id: 5, name: "Electronics", handle: "electronics" },
  { id: 6, name: "Services", handle: "services" },
]

export const HomeCategories = async ({ heading }: { heading: string }) => {
  return (
    <section className="bg-primary py-8 w-full">
      <div className="mb-6">
        <h2 className="heading-lg text-primary uppercase">{heading}</h2>
      </div>
      <Carousel
        items={categories?.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      />
    </section>
  )
}
