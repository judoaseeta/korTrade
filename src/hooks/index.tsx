import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
// usecase
import { ParsedCategoryQueryString } from '../types/usecase'

export const useCategoryQueries = (): ParsedCategoryQueryString => {
    const [queries] = useSearchParams()
    const category1 = queries.get('category1') || ''
    const category2 = queries.get('category2') || ''
    const category3 = queries.get('category3') || ''
    return {
        category1,
        category2,
        category3,
    }
}
export const useCategories = () => {
    const navigate = useNavigate()
    const categories = useCategoryQueries()
    const currentCategory = useMemo(() => {
        if (!categories.category1) {
            return ''
        } else if (!categories.category2) {
            return categories.category1
        } else if (!categories.category3) {
            return categories.category2
        } else {
            return categories.category3
        }
    }, [categories])
    const navigateCategory = useCallback(
        (newCategory: string) => {
            if (!categories.category1) {
                navigate(`/?category1=${newCategory}`)
            } else if (!categories.category2) {
                navigate(`/?category1=${categories.category1}&category2=${newCategory}`)
            } else if (!categories.category3) {
                navigate(
                    `/?category1=${categories.category1}&category2=${categories.category2}&category3=${newCategory}`,
                )
            } else {
                navigate("/?category1=''")
            }
        },
        [categories, navigate],
    )
    const navigateToCategoryObj = useCallback(
        (newCategories: ParsedCategoryQueryString) => {
            if (!newCategories.category1 && !newCategories.category2 && !newCategories.category3) {
                navigate('/')
            } else if (!newCategories.category2 && !newCategories.category3) {
                navigate(`/?category1=${newCategories.category1}`)
            } else if (!newCategories.category3) {
                navigate(`/?category1=${newCategories.category1}&category2=${newCategories.category2}`)
            } else {
                navigate(
                    `/?category1=${newCategories.category1}&category2=${newCategories.category2}&category3=${newCategories.category3}`,
                )
            }
        },
        [navigate],
    )
    return {
        categories,
        currentCategory,
        navigateCategory,
        navigateToCategoryObj,
    }
}
