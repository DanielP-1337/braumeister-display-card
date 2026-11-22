"""Exercise the frost automation with HA's script engine and simulated hardware."""

from datetime import timedelta
from pathlib import Path

import pytest
from homeassistant.core import SupportsResponse
from homeassistant.setup import async_setup_component
from homeassistant.util import dt

pytest_plugins = ("pytest_homeassistant_custom_component",)


@pytest.mark.asyncio
@pytest.mark.parametrize("with_extras", [False, True])
async def test_delayed_start_frost_warning(hass, tmp_path, with_extras):
    inputs = {
        "connection": "sensor.link", "step": "sensor.step", "temperature": "sensor.water",
        "warning_timer": "timer.frost", "threshold": 3, "horizon": 12,
        "weather": ["weather.balcony"], "notification": [{"action": "notify.phone"}],
    }

    if not with_extras:
        inputs.update(weather=[], notification=[])
    name = "braumeister-frost-warning.yaml"
    hass.config.config_dir = str(tmp_path)
    path = tmp_path / "blueprints" / "automation" / "braumeister" / name
    path.parent.mkdir(parents=True)
    path.write_bytes((Path(__file__).parent / "blueprints" / name).read_bytes())
    config = {"use_blueprint": {"path": f"braumeister/{name}", "input": inputs}}
    assert await async_setup_component(hass, "timer", {"timer": {"frost": {}}})
    pushes = []
    slots = []

    async def forecast(call):
        assert with_extras
        return {"weather.balcony": {"forecast": slots}}

    async def notify(call):
        pushes.append(call)

    hass.services.async_register("weather", "get_forecasts", forecast, supports_response=SupportsResponse.ONLY)
    hass.services.async_register("notify", "phone", notify)
    hass.states.async_set("sensor.link", "online")
    hass.states.async_set("sensor.water", "8", {"unit_of_measurement": "°C"})
    hass.states.async_set("weather.balcony", "cloudy", {"temperature_unit": "°F"})
    attrs = {"display_state_code": 2120, "display_start_delay_seconds": 7200, "display_interrupt": 0}
    hass.states.async_set("sensor.step", "waiting", attrs)
    assert await async_setup_component(hass, "automation", {"automation": [{**config, "alias": "Frost test"}]})
    await hass.async_block_till_done()

    async def check(state, count):
        await hass.services.async_call("automation", "trigger", {"entity_id": "automation.frost_test"}, blocking=True)
        await hass.async_block_till_done()
        assert hass.states.get("timer.frost").state == state
        assert len(pushes) == count

    if not with_extras:
        await check("idle", 0)
        hass.states.async_set("sensor.water", "2", {"unit_of_measurement": "°C"})
        await check("active", 0)
        hass.states.async_set("sensor.link", "offline")
        await hass.async_block_till_done()
        assert hass.states.get("timer.frost").state == "idle"
        return

    def slot(hours, value):
        return {"datetime": (dt.utcnow() + timedelta(hours=hours)).isoformat(), "temperature": value}

    slots[:] = [slot(-3, 22), slot(3, 20), slot(1, 55)]
    await check("idle", 0)
    slots[:] = [slot(1, 30)]
    await check("active", 1)
    await check("active", 1)
    slots[:] = [slot(1, 55)]
    await check("idle", 1)
    hass.states.async_set("sensor.water", "unknown", {"unit_of_measurement": "°C"})
    await check("idle", 1)
    hass.states.async_set("sensor.water", "3", {"unit_of_measurement": "°C"})
    await check("active", 2)
    hass.states.async_set("sensor.water", "39.2", {"unit_of_measurement": "°F"})
    await check("active", 2)
    hass.states.async_set("sensor.step", "purging", {**attrs, "display_state_code": 2300})
    await hass.async_block_till_done()
    assert hass.states.get("timer.frost").state == "idle"
