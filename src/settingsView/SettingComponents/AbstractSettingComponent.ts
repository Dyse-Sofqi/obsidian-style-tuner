import { CSSSetting } from '../../SettingHandlers';
import { CSSSettingsManager } from '../../SettingsManager';
import { getDescription, getTitle } from '../../Utils';
import fuzzysort from 'fuzzysort';
import { Component, Setting } from 'obsidian';
import { SettingType } from './types';

export abstract class AbstractSettingComponent extends Component {
	parent: AbstractSettingComponent | HTMLElement;
	childEl: HTMLElement | null = null;
	sectionId: string;
	sectionName: string;
	setting: CSSSetting;
	settingsManager: CSSSettingsManager;
	isView: boolean;
	/** Rendered row element; populated by concrete components in render(). */
	settingEl?: Setting;

	constructor(
		parent: AbstractSettingComponent | HTMLElement,
		sectionId: string,
		sectionName: string,
		setting: CSSSetting,
		settingsManager: CSSSettingsManager,
		isView: boolean
	) {
		super();
		this.parent = parent;
		this.sectionId = sectionId;
		this.sectionName = sectionName;
		this.setting = setting;
		this.settingsManager = settingsManager;
		this.isView = isView;
	}

	get containerEl() {
		return this.parent instanceof HTMLElement
			? this.parent
			: this.parent.childEl;
	}

	onload(): void {
		this.render();
		this.updateModifiedState();
	}

	/**
	 * True when the user has stored a custom value for this setting
	 * (themed colors count as modified when either theme slot is stored).
	 */
	isModified(): boolean {
		const setting = this.setting;

		if (setting.type === SettingType.HEADING) {
			return false;
		}

		if (setting.type === SettingType.VARIABLE_THEMED_COLOR) {
			return (
				this.settingsManager.getSetting(
					this.sectionId,
					`${setting.id}@@light`
				) !== undefined ||
				this.settingsManager.getSetting(
					this.sectionId,
					`${setting.id}@@dark`
				) !== undefined
			);
		}

		return (
			this.settingsManager.getSetting(this.sectionId, setting.id) !==
			undefined
		);
	}

	/**
	 * Refreshes the `is-modified` state class on the rendered setting row.
	 * Call after saving or resetting a value.
	 */
	updateModifiedState(): void {
		this.settingEl?.settingEl?.toggleClass(
			'is-modified',
			this.isModified()
		);
	}

	onunload(): void {
		this.destroy();
	}

	/**
	 * Matches the Component against `str`. A perfect match returns 0, no match returns negative infinity.
	 *
	 * @param str the string to match this Component against.
	 */
	match(str: string): number {
		if (!str) {
			return Number.NEGATIVE_INFINITY;
		}

		const title = getTitle(this.setting);
		const description = getDescription(this.setting) || '';

		return Math.max(
			fuzzysort.single(str, title)?.score ?? Number.NEGATIVE_INFINITY,
			fuzzysort.single(str, description)?.score ?? Number.NEGATIVE_INFINITY
		);
	}

	/**
	 * Matches the Component against `str`. A match returns true, no match  or a bad match returns false.
	 *
	 * @param str the string to match this Component against.
	 */
	decisiveMatch(str: string): boolean {
		return this.match(str) > -100000;
	}

	/**
	 * Renders the Component and all it's children into `containerEl`.
	 */
	abstract render(): void;

	/**
	 * Destroys the component and all it's children.
	 */
	abstract destroy(): void;
}
