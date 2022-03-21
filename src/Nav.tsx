import React from 'react'
// hooks
import { useCategories } from './hooks'
// types
import { NavProps } from './types/view'
import { TradeTypeEnum } from './types/entity'
// styles
import './nav.css'
export default function Nav({ timeRange, tradeType, onChangeTradeType }: NavProps): JSX.Element {
    const { categories, currentCategory, navigateToCategoryObj } = useCategories()
    return (
        <nav className="nav">
            <div className="flex items-center">
                <h1 className="nav_heading">{timeRange[0]} </h1>
                {timeRange[1] && <h1 className="nav_time">- {timeRange[1]}</h1>}
                <h1 className="nav_heading"> 대한민국 품목별 무역 통계 - </h1>
                <label className="nav_label" htmlFor="trade_type">
                    <h5 className="ml-2">유형별: </h5>
                    <select className="nav_selector" id="trade_type" onChange={onChangeTradeType} value={tradeType}>
                        {Object.values(TradeTypeEnum).map((type) => (
                            <option key={`trade_type_${type}`} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div>
                {categories.category1 && (
                    <span
                        className="nav_breadcrumb"
                        onClick={() =>
                            navigateToCategoryObj({
                                category1: '',
                                category2: '',
                                category3: '',
                            })
                        }
                    >
                        전체
                    </span>
                )}
                {categories.category1 && (
                    <span
                        className={`nav_breadcrumb ${categories.category1 === currentCategory ? 'selected' : ''}`}
                        onClick={() =>
                            navigateToCategoryObj({
                                category1: categories.category1,
                                category2: '',
                                category3: '',
                            })
                        }
                    >
                        대분류: {categories.category1}
                    </span>
                )}
                {categories.category2 && (
                    <span
                        className={`nav_breadcrumb ${categories.category2 === currentCategory ? 'selected' : ''}`}
                        onClick={() =>
                            navigateToCategoryObj({
                                category1: categories.category1,
                                category2: categories.category2,
                                category3: '',
                            })
                        }
                    >
                        중분류: {categories.category2}
                    </span>
                )}
                {categories.category3 && (
                    <span
                        className={`nav_breadcrumb ${categories.category3 === currentCategory ? 'selected' : ''}`}
                        onClick={() =>
                            navigateToCategoryObj({
                                category1: categories.category1,
                                category2: categories.category2,
                                category3: categories.category3,
                            })
                        }
                    >
                        소분류: {categories.category3}
                    </span>
                )}
            </div>
        </nav>
    )
}
